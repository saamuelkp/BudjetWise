from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Transaction, User
import pandas as pd
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/conseils', methods=['GET'])
@jwt_required()
def get_conseils():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    
    if len(transactions) < 2:
        return jsonify({
            'conseils': ['Continuez à entrer vos dépenses pour recevoir des conseils personnalisés !'],
            'analyse': {}
        }), 200
    
    # Convertir en DataFrame pandas
    data = [{
        'montant': t.montant,
        'categorie': t.categorie,
        'date': t.date
    } for t in transactions]
    
    df = pd.DataFrame(data)
    
    # Analyse par catégorie
    par_categorie = df.groupby('categorie')['montant'].sum().to_dict()
    moyenne_par_categorie = df.groupby('categorie')['montant'].mean().to_dict()
    
    conseils = []
    
    # Conseil 1 - Catégorie la plus dépensée
    categorie_max = max(par_categorie, key=par_categorie.get)
    conseils.append(f"Tu dépenses le plus en {categorie_max} ({round(par_categorie[categorie_max], 2)}$). Essaie de réduire dans cette catégorie.")
    
    # Conseil 2 - Budget restant
    total = df['montant'].sum()
    budget_restant = user.salaire - total
    pourcentage_utilise = (total / user.salaire) * 100
    
    if pourcentage_utilise > 80:
        conseils.append(f"Attention ! Tu as déjà utilisé {round(pourcentage_utilise, 1)}% de ton budget. Il te reste seulement {round(budget_restant, 2)}$.")
    elif pourcentage_utilise > 50:
        conseils.append(f"Tu as utilisé {round(pourcentage_utilise, 1)}% de ton budget. Reste vigilant pour ne pas dépasser.")
    else:
        conseils.append(f"Bonne gestion ! Tu as utilisé seulement {round(pourcentage_utilise, 1)}% de ton budget. Continue comme ça !")
    
    # Conseil 3 - Nombre de transactions
    nb_transactions = len(transactions)
    if nb_transactions > 20:
        conseils.append(f"Tu as fait {nb_transactions} transactions. Essaie de regrouper tes achats pour mieux contrôler tes dépenses.")
    
    # Conseil 4 - Épargne suggérée
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