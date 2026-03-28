from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Transaction, User
from datetime import datetime, timedelta

transactions_bp = Blueprint('transactions', __name__)

def get_debut_periode_courante(user):
    """Calcule le début de la période de paie courante"""
    if not user.date_premiere_paie:
        # Pas de date de paie configurée — fallback sur le mois courant
        maintenant = datetime.now()
        return maintenant.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    frequence_jours = 7 if user.frequence_paie == 'semaine' else 14
    maintenant = datetime.now()
    premiere_paie = user.date_premiere_paie

    # Calculer combien de périodes se sont écoulées depuis la première paie
    jours_ecoules = (maintenant - premiere_paie).days
    periodes_ecoulees = jours_ecoules // frequence_jours

    # Début de la période courante
    debut_periode = premiere_paie + timedelta(days=periodes_ecoulees * frequence_jours)

    return debut_periode.replace(hour=0, minute=0, second=0, microsecond=0)

def get_fin_periode_courante(user):
    """Calcule la fin de la période de paie courante"""
    frequence_jours = 7 if user.frequence_paie == 'semaine' else 14
    debut = get_debut_periode_courante(user)
    return debut + timedelta(days=frequence_jours)

def get_transactions_periode(user_id, mois=None):
    """Retourne les transactions de la période courante ou d'un mois spécifique"""
    user = User.query.get(user_id)

    if mois:
        try:
            debut = datetime.strptime(mois, '%Y-%m')
            if debut.month == 12:
                fin = debut.replace(year=debut.year + 1, month=1)
            else:
                fin = debut.replace(month=debut.month + 1)
        except ValueError:
            return None
    else:
        debut = get_debut_periode_courante(user)
        fin = get_fin_periode_courante(user)

    return Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= debut,
        Transaction.date < fin
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
    mois = request.args.get('mois')

    transactions = get_transactions_periode(user_id, mois)

    if transactions is None:
        return jsonify({'erreur': 'Format de mois invalide. Utilise YYYY-MM'}), 400

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

@transactions_bp.route('/historique', methods=['GET'])
@jwt_required()
def get_historique():
    """Retourne la liste des mois qui ont des transactions"""
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id).all()

    mois_set = set()
    for t in transactions:
        mois_set.add(t.date.strftime('%Y-%m'))

    mois_tries = sorted(mois_set, reverse=True)
    return jsonify({'mois_disponibles': mois_tries}), 200

@transactions_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    mois = request.args.get('mois')

    transactions = get_transactions_periode(user_id, mois)

    if transactions is None:
        return jsonify({'erreur': 'Format de mois invalide. Utilise YYYY-MM'}), 400

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

    # Infos de la période courante
    debut_periode = get_debut_periode_courante(user)
    fin_periode = get_fin_periode_courante(user)

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
        'periode': {
            'debut': debut_periode.strftime('%Y-%m-%d'),
            'fin': fin_periode.strftime('%Y-%m-%d'),
            'frequence': user.frequence_paie
        }
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