from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Transaction, User
import pandas as pd
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/conseils', methods=['GET'])
@jwt_required()
def get_conseils():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    # Conseils basés sur le mois courant seulement
    maintenant = datetime.now()
    debut_mois = maintenant.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= debut_mois
    ).all()

    if len(transactions) < 2:
        return jsonify({
            'conseils': ['Continuez à entrer vos dépenses pour recevoir des conseils personnalisés !'],
            'analyse': {}
        }), 200

    data = [{'montant': t.montant, 'categorie': t.categorie, 'date': t.date} for t in transactions]
    df = pd.DataFrame(data)

    par_categorie = df.groupby('categorie')['montant'].sum().to_dict()
    moyenne_par_categorie = df.groupby('categorie')['montant'].mean().to_dict()

    conseils = []

    categorie_max = max(par_categorie, key=par_categorie.get)
    conseils.append(f"Tu dépenses le plus en {categorie_max} ({round(par_categorie[categorie_max], 2)}$). Essaie de réduire dans cette catégorie.")

    total = df['montant'].sum()
    budget_restant = user.salaire - total
    pourcentage_utilise = (total / user.salaire) * 100 if user.salaire > 0 else 0

    if pourcentage_utilise > 80:
        conseils.append(f"Attention ! Tu as déjà utilisé {round(pourcentage_utilise, 1)}% de ton budget. Il te reste seulement {round(budget_restant, 2)}$.")
    elif pourcentage_utilise > 50:
        conseils.append(f"Tu as utilisé {round(pourcentage_utilise, 1)}% de ton budget. Reste vigilant.")
    else:
        conseils.append(f"Bonne gestion ! Tu as utilisé seulement {round(pourcentage_utilise, 1)}% de ton budget.")

    nb_transactions = len(transactions)
    if nb_transactions > 20:
        conseils.append(f"Tu as fait {nb_transactions} transactions ce mois. Essaie de regrouper tes achats.")

    epargne_suggeree = round(user.salaire * 0.2, 2)
    conseils.append(f"On recommande d'épargner 20% de ton salaire. Pour toi c'est {epargne_suggeree}$ par mois.")

    return jsonify({
        'conseils': conseils,
        'analyse': {
            'total_depense': round(total, 2),
            'budget_restant': round(budget_restant, 2),
            'pourcentage_utilise': round(pourcentage_utilise, 1),
            'par_categorie': par_categorie,
            'moyenne_par_categorie': moyenne_par_categorie
        }
    }), 200

@analytics_bp.route('/statistiques', methods=['GET'])
@jwt_required()
def get_statistiques():
    """Stats sur tous les mois — moyenne, mois le plus dépensier, tendance"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    transactions = Transaction.query.filter_by(user_id=user_id).all()

    if len(transactions) < 2:
        return jsonify({'message': 'Pas assez de données pour les statistiques.'}), 200

    data = [{'montant': t.montant, 'categorie': t.categorie, 'date': t.date} for t in transactions]
    df = pd.DataFrame(data)

    df['mois'] = df['date'].dt.strftime('%Y-%m')

    # Total par mois
    total_par_mois = df.groupby('mois')['montant'].sum().to_dict()

    # Moyenne mensuelle
    moyenne_mensuelle = round(df.groupby('mois')['montant'].sum().mean(), 2)

    # Mois le plus dépensier
    mois_max = max(total_par_mois, key=total_par_mois.get)

    # Mois le moins dépensier
    mois_min = min(total_par_mois, key=total_par_mois.get)

    # Catégorie la plus dépensée globalement
    categorie_dominante = df.groupby('categorie')['montant'].sum().idxmax()

    # Tendance — est-ce que les dépenses augmentent ou diminuent?
    mois_tries = sorted(total_par_mois.keys())
    tendance = None
    if len(mois_tries) >= 2:
        dernier = total_par_mois[mois_tries[-1]]
        avant_dernier = total_par_mois[mois_tries[-2]]
        diff = round(dernier - avant_dernier, 2)
        if diff > 0:
            tendance = f"Tes dépenses ont augmenté de {diff}$ par rapport au mois précédent."
        elif diff < 0:
            tendance = f"Tes dépenses ont diminué de {abs(diff)}$ par rapport au mois précédent."
        else:
            tendance = "Tes dépenses sont stables par rapport au mois précédent."

    return jsonify({
        'total_par_mois': total_par_mois,
        'moyenne_mensuelle': moyenne_mensuelle,
        'mois_plus_depensier': {'mois': mois_max, 'montant': round(total_par_mois[mois_max], 2)},
        'mois_moins_depensier': {'mois': mois_min, 'montant': round(total_par_mois[mois_min], 2)},
        'categorie_dominante': categorie_dominante,
        'tendance': tendance,
        'salaire': user.salaire
    }), 200