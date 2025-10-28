"""
Tool analyse messages from a provided json file and produce an analysis with 
grammar and style errors stored in a separate file 
"""
import json
from openai import OpenAI
from .clients import client_gpt_4o

class Analyser:
    def __init__ (self, student_id:str):
        """ Init constructror to initiate arguments
        Args:
            self.student_id(str): identification number of the student 
        """
        self.message = ""
        self.client, self.model = client_gpt_4o()
        self.student_id = student_id

    def load_filter_file(self, File_To_Analyse:str):
        """ Loading the file 
        Args:
            File_To_Analyse (str): the file containing the stored conversation
        """
        with open(File_To_Analyse, 'r', encoding='utf-8') as file:
            self.filedata = json.load(file)

    def error_analyse(self,text_json):
        """ Générer un rapport 
        Args:
            text(dict): the text that
        Return:
            analyse_resultat(dict): analyse des résultats
        """
        system_prompt = f"""
        Analysez ce texte français {text_json} et identifiez CHAQUE erreur de grammaire et de style séparément.
        Répondez dans le format json comme indiqué ci-dessous:
    
        {{
            "erreurs_grammaire": [
                {{
                    "id": "{message_id}_gram_1",
                    "erreur_originale": "texte exact avec l'erreur",
                    "correction": "texte corrigé",
                    "type_erreur": "accord/préposition/article/vocabulaire/conjugaison",
                    "contexte": "phrase complète où apparaît l'erreur",
                    "niveau_difficulte": "A1/A2/B1/B2/C1/C2"
                }},
                {{
                    "id": "{message_id}_gram_2",
                    "erreur_originale": "texte exact avec l'erreur",
                    "correction": "texte corrigé",
                    "type_erreur": "accord/préposition/article/vocabulaire/conjugaison",
                    "contexte": "phrase complète où apparaît l'erreur",
                    "niveau_difficulte": "A1/A2/B1/B2/C1/C2"
                }}
            ],
            "erreurs_style": [
                {{
                    "id": "{message_id}_style_1",
                    "erreur_originale": "texte avec problème de style",
                    "suggestion": "amélioration proposée",
                    "type_style": "répétition/lourdeur/familiarité/cohérence",
                    "contexte": "phrase complète",
                    "niveau_difficulte": "A1/A2/B1/B2/C1/C2"
                }},
                {{
                    "id": "{message_id}_style_2",
                    "erreur_originale": "texte avec problème de style",
                    "suggestion": "amélioration proposée",
                    "type_style": "répétition/lourdeur/familiarité/cohérence",
                    "contexte": "phrase complète",
                    "niveau_difficulte": "A1/A2/B1/B2/C1/C2"
                }}
            ]
        }}

        Attention: Le fichier ne doit pas commencer par ```json et terminer par ```
        """ 
        
        print("Launching error analyse")
        messages= [{"role":"system","content":system_prompt}]
        response = self.client.chat.completions.create(model=self.model, messages=messages)
        analyse_resultat=response.choices[0].message.content
        print("Resultat de l'analyse:",analyse_resultat)
        return analyse_resultat
                    
    def parse_analyse(self,analyse_resultat:dict):
        """ Parser le résultat et mettre les résultats dans les variables
        Args:
            analyse_resultat(dict): resultat brut  
        """
        self.erreurs_grammaire=analyse_resultat["erreurs_grammaire"]
        self.erreurs_style=analyse_resultat["erreurs_style"]
        # Display formatted results
        print("\n" + "="*80)
        print("📝 ANALYSE DES ERREURS")
        print("="*80)
        print("\n🔴 ERREURS DE GRAMMAIRE:")
        print("-" * 50)
        print(self.erreurs_grammaire)
        print("\n🟡 ERREURS DE STYLE:")
        print("-" * 50)
        print(self.erreurs_style)
        print("="*80)


    def store_data(self,store_file, conversation_i):
        """ Rajouter les résultat à la base de donnée et les sauvegarder"""
        conversation = conversation_i
        conversation["erreurs_grammaire"] = self.erreurs_grammaire
        conversation["erreurs_style"] = self.erreurs_style
        with open(store_file,"w", encoding="utf-8") as f:
            json.dump(self.filedata, f, indent=4, ensure_ascii=False)


if __name__ == "__main__":
    print("Analyser initialisation")
    Error_Analyser = Analyser("dominika")
    vectore_database = pinecone_db()
    
    Error_Analyser.load_filter_file("analysis_results.json")
    print("\n\n")

    input_12 = input("1: if you want to analyse the data \n2: if you want to analyse and upload to pinecone\n3: both\n")

    for i, conversation in enumerate(Error_Analyser.filedata["conversations"]):
        message_id = conversation["message_id"]
        if (input_12 == "1" or input_12 == "3"):
            if "erreurs_grammaire" not in conversation:
                print(f"✅ No analysis found for {message_id}. Starting analysis...")
                analyse_resultat=Error_Analyser.error_analyse(conversation["message"],message_id)
                parsed_analyse=json.loads(analyse_resultat)
                Error_Analyser.parse_analyse(parsed_analyse)
                Error_Analyser.store_data("analysis_results.json", conversation)

        if (input_12 == "2" or input_12 == "3"):    
            # Vectoriser chaque erreur de grammaire séparément
            for erreur in conversation["erreurs_grammaire"]:
                error_text = f"Type: {erreur['type_erreur']} | Erreur: {erreur['erreur_originale']} → {erreur['correction']} | Règle: {erreur['regle_grammaire'] } | Niveau: {erreur['niveau_difficulte']}"
                
                vectore_database.create_index(
                    "dominika",
                    erreur['id'],
                    error_text,
                    erreur['type_erreur'],
                    "erreurs_grammaire"
                )

            # Vectoriser chaque erreur de style séparément
            for erreur in conversation["erreurs_style"]:
                error_text = f"Type: {erreur['type_style']} | Problème: {erreur['erreur_originale']} → {erreur['suggestion']} | Type: {erreur['type_style']} | Niveau: {erreur['niveau_difficulte']}"
                    
                vectore_database.create_index(
                    "dominika",
                    erreur['id'],
                    error_text,
                    erreur['type_style'],
                    "erreurs_style"

            )

    if input("Put yes if you want to extract recurent grammar and style errors") == "yes":
        #query = "Montre moi les erreurs de grammaire"
        #vectore_database.query(Error_Analyser.student_id,query,"erreurs_grammaire")
        vectore_database.analyze_recurring_errors("dominika", "erreurs_grammaire")
        vectore_database.analyze_recurring_errors("dominika", "erreurs_style")