from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Mail, Message
from database import db, User
import bcrypt

auth_bp = Blueprint('auth', __name__)

def envoyer_email_confirmation(nom, email):
    try:
        mail = Mail(current_app)
        msg = Message(
            subject="Bienvenue sur BudgetWise !",
            sender=current_app.config['MAIL_USERNAME'],
            recipients=[email]
        )
        msg.body = f"""Bonjour {nom},

Ton compte BudgetWise a été créé avec succès !

Tu peux maintenant te connecter et commencer à gérer ton budget.

Bonne gestion,
L'équipe BudgetWise
"""
        mail.send(msg)
    except Exception as e:
        print(f"Erreur envoi email: {e}")

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'erreur': 'Email déjà utilisé'}), 400

    mot_de_passe_hash = bcrypt.hashpw(
        data['password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    nouvel_user = User(
        nom=data['name'],
        email=data['email'],
        mot_de_passe=mot_de_passe_hash,
        salaire=data.get('salary', 0)
    )

    db.session.add(nouvel_user)
    db.session.commit()

    envoyer_email_confirmation(data['name'], data['email'])

    return jsonify({'message': 'Compte créé avec succès !'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data['email']).first()

    if not user:
        return jsonify({'erreur': 'Email ou mot de passe incorrect'}), 401

    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.mot_de_passe.encode('utf-8')):
        return jsonify({'erreur': 'Email ou mot de passe incorrect'}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        'token': token,
        'name': user.nom,
        'nom': user.nom,
        'email': user.email
    }), 200

@auth_bp.route('/salaire', methods=['PUT'])
@jwt_required()
def modifier_salaire():
    user_id = get_jwt_identity()
    data = request.get_json()

    user = User.query.get(user_id)

    if not user:
        return jsonify({'erreur': 'Utilisateur introuvable'}), 404

    user.salaire = data['salaire']
    db.session.commit()

    return jsonify({
        'message': 'Salaire mis à jour !',
        'salaire': user.salaire
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Changer son mot de passe quand on est connecté"""
    user_id = get_jwt_identity()
    data = request.get_json()

    user = User.query.get(user_id)

    if not user:
        return jsonify({'erreur': 'Utilisateur introuvable'}), 404

    if not bcrypt.checkpw(data['old_password'].encode('utf-8'), user.mot_de_passe.encode('utf-8')):
        return jsonify({'erreur': 'Ancien mot de passe incorrect'}), 401

    user.mot_de_passe = bcrypt.hashpw(
        data['new_password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    db.session.commit()

    return jsonify({'message': 'Mot de passe changé avec succès !'}), 200