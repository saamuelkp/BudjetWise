import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from database import db, User, Transaction, Budget
from auth import auth_bp
from transactions import transactions_bp
from analytics import analytics_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///budgetwise.db'
app.config['SECRET_KEY'] = 'budgetwise-secret-key'
app.config['JWT_SECRET_KEY'] = 'budgetwise-jwt-secret'

# Configuration email via variables d'environnement Railway
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

db.init_app(app)
jwt = JWTManager(app)
CORS(app, origins="*", supports_credentials=True)
mail = Mail(app)

app.register_blueprint(auth_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(analytics_bp)

@app.route('/')
def home():
    return {'message': 'BudgetWise API v2 fonctionne !'}

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)