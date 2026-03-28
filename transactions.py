from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Transaction, User
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__)

def get_transactions_mois_courant(user_id):
    """Retourne seulement les transactions du mois courant"""
    maintenant = datetime.now()
    debut_mois = maintenant.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= debut_mois
    ).all()

@transactions_bp.route('/transactions', methods=['POST'])
@jwt_required()
def ajouter_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    nouvelle_transaction = Transaction(
        user_id=user_id,
        montant=data.get('amount', data.get('montant')),
        categorie=data.get('category', data.get('categorie')),
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
    
    # Seulement les transactions du mois courant
    transactions = get_transactions_mois_courant(user_id)
    
    resultat = []
    for t in transactions:
        resultat.append({
            'id': t.id,
            'amount': t.montant,
            'montant': t.montant,
            'category': t.categorie,
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
    
    # Seulement les transactions du mois courant
    transactions = get_transactions_mois_courant(user_id)
    
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

    # Infos du mois courant pour le frontend
    maintenant = datetime.now()
    mois_courant = maintenant.strftime('%B %Y')
    
    return jsonify({
        'salary': user.salaire,
        'salaire': user.salaire,
        'total_expenses': total_depense,
        'total_depense': total_depense,
        'remaining_budget': budget_restant,
        'budget_restant': budget_restant,
        'expenses_by_category': par_categorie,
        'par_categorie': par_categorie,
        'alerts': alertes,
        'alertes': alertes,
        'mois': mois_courant
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