from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import db, User
import bcrypt

auth_bp = Blueprint('auth', __name__)

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