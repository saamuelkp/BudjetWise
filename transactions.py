from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Transaction, User
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/transactions', methods=['POST'])
@jwt_required()
def ajouter_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    nouvelle_transaction = Transaction(
        user_id=user_id,
        montant=data['montant'],
        categorie=data['categorie'],
        description=data.get('description', ''),
        date=datetime.now()
    )
    
    db.session.add(nouvelle_transaction)
    db.session.commit()
    
    return jsonify({'message': 'Dépense ajoutée !'}), 201

@transactions_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    
    resultat = []
    for t in transactions:
        resultat.append({
            'id': t.id,
            'montant': t.montant,
            'categorie': t.categorie,
            'description': t.description,
            'date': t.date.strftime('%Y-%m-%d %H:%M')
        })
    
    return jsonify(resultat), 200

@transactions_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    
    total_depense = sum(t.montant for t in transactions)
    budget_restant = user.salaire - total_depense
    
    par_categorie = {}
    for t in transactions:
        if t.categorie not in par_categorie:
            par_categorie[t.categorie] = 0
        par_categorie[t.categorie] += t.montant
    
    alertes = []
    for categorie, montant in par_categorie.items():
        if montant > user.salaire * 0.3:
            alertes.append(f"Attention : tu dépenses beaucoup en {categorie} ({montant}$)")
    
    return jsonify({
        'salaire': user.salaire,
        'total_depense': total_depense,
        'budget_restant': budget_restant,
        'par_categorie': par_categorie,
        'alertes': alertes
    }), 200

@transactions_bp.route('/transactions/<int:id>', methods=['DELETE'])
@jwt_required()
def supprimer_transaction(id):
    user_id = get_jwt_identity()
    
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()
    
    if not transaction:
        return jsonify({'erreur': 'Transaction introuvable'}), 404
    
    db.session.delete(transaction)
    db.session.commit()
    
    return jsonify({'message': 'Dépense supprimée !'}), 200
