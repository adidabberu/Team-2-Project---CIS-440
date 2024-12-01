import datetime
import jwt  # Import PyJWT
from flask import Blueprint, current_app, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from extensions import db  # Import db from the newly created extensions.py file
from model import User  # Import the User model
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import pandas as pd

routes_blueprint = Blueprint('routes', __name__)

# Load the model and tokenizer globally for efficiency
MODEL_NAME = "microsoft/DialoGPT-medium"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)


THRESHOLDS = {
    'Rent/Mortgage': 0.30,
    'Car Insurance': 0.10,
    'Groceries': 0.15,
    'Eating Out': 0.10,
    'Transportation': 0.10,
    'Entertainment': 0.10,
    'Savings': 0.20,
    'Phone Bill': 0.05,
    'Electricity': 0.10,
    'WiFi': 0.05,
    'Miscellaneous': 0.05,
}

@routes_blueprint.route('/analyze_budget', methods=['POST'])
def analyze_budget():
    try:
        budget_data = request.json
        df = pd.DataFrame(list(budget_data.items()), columns=["category", "amount"])

        # Ensure "Monthly Income" exists and calculate ratios
        total_income = df[df['category'] == 'monthlyIncome']['amount'].values[0]
        thresholds_df = pd.DataFrame(list(THRESHOLDS.items()), columns=['category', 'threshold'])
        result_df = pd.merge(df, thresholds_df, on="category", how="left")
        result_df['ratio'] = result_df['amount'] / total_income
        result_df['flag'] = result_df['ratio'] > result_df['threshold']

        flagged = result_df[result_df['flag']]
        flagged_categories = flagged[['category', 'amount', 'threshold', 'ratio']].to_dict(orient='records')

        return jsonify({
            'message': 'Budget analysis completed successfully.',
            'flagged_categories': flagged_categories
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# Helper function to decode the JWT token and validate the user
def validate_token(request):
    auth_header = request.headers.get('Authorization', None)  # Extract the authorization header
    if not auth_header:
        return None, jsonify({"error": "Token is missing!"}), 401  # Return error if token is missing

    try:
        token = auth_header.split(" ")[1]  # Split the header and get the token (format: "Bearer <token>")
        decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])  # Decode the JWT token
        user = User.query.filter_by(email=decoded_token['sub']).first()  # Find the user by email
        if not user:
            return None, jsonify({"error": "User not found!"}), 404  # Return error if user not found
        return user, None  # Return the user if the token is valid
    except jwt.ExpiredSignatureError:
        return None, jsonify({"error": "Token has expired"}), 401  # Token has expired
    except jwt.InvalidTokenError as e:
        return None, jsonify({"error": f"Token error: {str(e)}"}), 401  # Return error if token validation fails


# Define a blueprint for routing (modularizes the app's routes)
routes_blueprint = Blueprint('routes', __name__)

# Default route to serve the index.html file (home page)
@routes_blueprint.route('/')
def index():
    return render_template('index.html')  # Render the index.html template when accessing '/'

@routes_blueprint.route('/inside')
def inside():
    return render_template('example_app_page.html')  # Render the index.html template when accessing '/'

# Route to handle account creation
@routes_blueprint.route('/create_account', methods=['POST'])
def create_account():
    data = request.json  # Extract the incoming JSON data from the request

    email = data.get('email')
    password = data.get('password')
    description = data.get('description')

    # Check if any required fields are missing
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400  # Return error if any fields are missing

    # Check if a user with the provided email already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User with that email already exists"}), 400  # Return error if the email is already registered

    # Hash the user's password for security
    hashed_password = generate_password_hash(password, method='sha256')

    # Create the new account
    new_user = User(email=email, password=hashed_password, description=description)
    db.session.add(new_user)  # Add the new user to the database session
    db.session.commit()  # Commit the transaction to save the new user

    return jsonify({"message": "Account created successfully!"}), 201  # Return success message


# Route to handle user login
@routes_blueprint.route('/login', methods=['POST'])
def login():
    data = request.json  # Extract the incoming JSON data from the request

    email = data.get('email')
    password = data.get('password')

    # Check if any required fields are missing
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400  # Return error if email or password is missing

    # Check if the user exists and if the password matches
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 400  # Return error if credentials are invalid

    # Generate a JWT token that expires in 1 hour
    token = create_access_token(identity=user.email, expires_delta=datetime.timedelta(hours=1))

    # Return success message, token, and the user's admin status
    return jsonify({
        "message": "Login successful!", 
        "token": token,
        "admin": user.admin  # Include the admin property in the response
    }), 200


# Route to add a new user (requires JWT token)
@routes_blueprint.route('/add_user', methods=['POST'])
def add_user():
    current_user, error = validate_token(request)
    if error:
        return error  # If token validation fails, return the error

    # Check if the current user is an admin
    if not current_user.admin:
        return jsonify({"error": "You do not have the necessary permissions to perform this action"}), 403  # Return forbidden error if not admin

    data = request.json  # Extract the incoming JSON data

    email = data.get('email')
    password = data.get('password')
    description = data.get('description')
    is_admin = data.get('isAdmin', False)  # Updated: Get the admin parameter, defaulting to False

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User with that email already exists"}), 400

    hashed_password = generate_password_hash(password, method='sha256')
    new_user = User(email=email, password=hashed_password, description=description, admin=is_admin)  # Updated: Use isAdmin for the new user object
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User added successfully!"}), 201


# Route to edit a user (requires JWT token)
@routes_blueprint.route('/edit_user/<int:user_id>', methods=['PUT'])
def edit_user(user_id):
    current_user, error = validate_token(request)
    if error:
        return error  # If token validation fails, return the error

    # Check if the current user is an admin
    if not current_user.admin:
        return jsonify({"error": "You do not have the necessary permissions to perform this action"}), 403  # Return forbidden error if not admin

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404  # Return error if user not found

    data = request.json
    email = data.get('email')
    description = data.get('description')
    is_admin = data.get('admin', False)  # Get the admin parameter, defaulting to False

    # Update user information if provided
    if email:
        user.email = email
    if description:
        user.description = description
    user.admin = is_admin  # Update the admin status

    db.session.commit()

    return jsonify({"message": "User updated successfully!"}), 200


# Route to delete a user (requires JWT token)
@routes_blueprint.route('/delete_user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    current_user, error = validate_token(request)
    if error:
        return error  # If token validation fails, return the error

    # Check if the current user is an admin
    if not current_user.admin:
        return jsonify({"error": "You do not have the necessary permissions to perform this action"}), 403  # Return forbidden error if not admin

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404  # Return error if user not found

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted successfully!"}), 200


# Route to get all users (requires JWT token)
@routes_blueprint.route('/users', methods=['GET'])
def get_all_users():
    current_user, error = validate_token(request)
    if error:
        return error  # If token validation fails, return the error

    # Check if the current user is an admin
    if not current_user.admin:
        return jsonify({"error": "You do not have the necessary permissions to access this resource"}), 403  # Return a forbidden error if not admin

    # Retrieve all users from the database
    users = User.query.all()  
    users_data = [{"id": user.id, "email": user.email, "description": user.description, "admin": user.admin} for user in users]  # Format the user data

    return jsonify(users_data), 200  # Return the list of all users

@routes_blueprint.route('/chat', methods=['POST'])
def chat():
    """
    Handle chat requests by generating AI responses using DialoGPT.
    """
    try:
        # Extract the user's message from the JSON payload
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({"error": "Message content is required"}), 400

        # Tokenize the user input
        input_ids = tokenizer.encode(user_message, return_tensors='pt')

        # Create an attention mask (1 for actual tokens, 0 for padding tokens)
        attention_mask = torch.ones(input_ids.shape, dtype=torch.long)

        # Generate a response
        response_ids = model.generate(
            input_ids,
            max_length=200,
            num_return_sequences=1,
            no_repeat_ngram_size=5,
            early_stopping=True,
            do_sample=True,
            top_k=100,
            top_p=0.98,
            temperature=1.2,
            pad_token_id=tokenizer.eos_token_id,
            attention_mask=attention_mask  # Pass attention mask here
        )
        
        # Decode the response
        response_text = tokenizer.decode(response_ids[0], skip_special_tokens=True)

        return jsonify({"response": response_text}), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500