"""
For a specific student take JSON file with raw data and inject it directly to LLM request
"""
import json
from openai import OpenAI
from .clients import client_gpt_4o
import datetime

class Analyser:
    """
    Analyzes student writing samples for errors and learning progression.
    
    This class loads student conversation data, sends it to OpenAI's GPT-4 for analysis,
    and stores the results in structured JSON files for tracking student progress.
    """
    def __init__ (self, student_id:str):
        """ Init constructror to initiate arguments
        Args:
            self.student_id(str): identification number of the student 
        Attributes:
            message (str): Message content sent to the LLM
            client: OpenAI client instance
            model (str): GPT model identifier
            student_id (str): Student identifier
            store_file (str): Filename for storing analysis results
            filedata (Dict[str, Any]): Loaded student conversation data
        """
        self.message = ""
        self.client, self.model = client_gpt_4o()
        self.student_id = student_id
        self.store_file = f"{student_id}_analyse.json"

    def load_filter_file(self, File_To_Analyse:str):
        """ Loading and parse the student conversation from JSON file
        Args:
            File_To_Analyse (str): the file containing stored conversation
        """
        with open(File_To_Analyse, 'r', encoding='utf-8') as file:
            self.filedata = json.load(file)

    def error_analyse(self,text):
        """ Here we analyse grammar and style errors
        Args:
            text(dict): text 
        Return:
            analyse_resultat(dict): Analyse des erreurs faites par LLM
        """
        system_prompt = f"""
        Tu es un assistant pédagogique. 
        Analyser ces textes français {text} et identifier 
        les erreurs récurrents au niveau grammaire, vocabulaire style et les tendances d'évolution
        Fait une conclusion et propose des axes d'amélioration 

        Example:
        ERREURS RÉCURRENTES
            1. GRAMMAIRE
            Articles et contractions :
            Omission d'articles : "j´apprends le français" → "j'apprends le français"
            Contractions incorrectes : "Ce la est la raison" → "C'est la raison"
            Articles définis/indéfinis : "des gens qui je n'ai connu pas" → "des gens que je ne connais pas"
            Accord des participes passés :
            "j´ai arrivée" → "je suis arrivée"
            "j´ai visitée" → "j'ai visité"
            "j´ai passée la nuit" → "j'ai passé la nuit"
            Négation :
            Placement incorrect : "je n'ai connu pas" → "je ne connais pas"
            Double négation : persistante dans plusieurs textes
            Temps verbaux :
            Confusion passé composé/imparfait : "j'eu un cappuccino" → "j'ai eu un cappuccino"
            Concordance des temps : "si le cadeau était... il serait triste" (correct) vs erreurs dans d'autres contextes
            2. VOCABULAIRE
            Anglicismes et interférences :
            "slang" → "argot"
            "performance" (anglicisme acceptable mais pourrait être "rendement")
            Faux amis et calques :
            "défises" → "défis"
            "bordélique" (familier, mais acceptable)
            "avanture d'adrénaline" → "aventure pleine d'adrénaline"
            Registre de langue :
            Mélange registre familier/soutenu inconsistant
            "Ô mon dieu" dans un contexte informel (acceptable)
            3. STYLE
            Structure des phrases :
            Phrases parfois trop longues et complexes
            Coordination excessive avec "et", "mais", "puis"
            Manque de variété dans les connecteurs
            Ponctuation :
            Espaces avant les signes de ponctuation (influence de la typographie française)
            Usage inconsistant des virgules
            TENDANCES D'ÉVOLUTION
            PROGRESSION POSITIVE (2024-2025)
            Complexité syntaxique :
            Début (leçon 1) : Phrases simples, erreurs basiques
            Milieu (leçons 5-10) : Structures plus complexes, subjonctif occasionnel
            Récent (leçons 13-15) : Argumentation structurée, nuances d'expression
            Vocabulaire :
            Enrichissement progressif : passage d'un vocabulaire de base à des termes plus spécialisés
            Registres variés : adaptation selon le contexte (formel pour les lettres officielles)
            Cohérence textuelle :
            Amélioration notable dans l'organisation des idées
            Connecteurs logiques plus variés dans les textes récents
            ERREURS PERSISTANTES
            Accord des participes :
            Erreur récurrente même dans les textes les plus récents
            Confusion être/avoir persistante
            Interférences L1 (slovaque) :
            Structure syntaxique parfois calquée sur le slovaque
            Certaines constructions restent non-natives
            Prépositions :
            Choix parfois incorrect : "travailler en Slovaquie" vs "travailler dans"
            RECOMMANDATIONS PÉDAGOGIQUES
             Priorités d'intervention :
            Accord des participes passés - exercices systématiques être/avoir
            Placement de la négation - automatisation par répétition
            Choix des prépositions - listes contextualisées
            Registre de langue - sensibilisation aux niveaux de langue
            Points forts à maintenir :
            Motivation élevée et expression personnelle riche
            Capacité d'argumentation en développement
            Adaptation au contexte (lettres formelles vs informelles)
            Évolution globale :
            Dominika montre une progression significative sur XX mois, passant d'un niveau XXX à un niveau XXX s, avec une capacité croissante à exprimer des idées complexes malgré des erreurs systémiques persistantes.

        """

        print("Launching error analyse")
        messages= [{"role":"system","content":system_prompt}]
        response = self.client.chat.completions.create(model=self.model, messages=messages)
        analyse_resultat=response.choices[0].message.content
        print("Resultat de l'analyse:",analyse_resultat)
        return analyse_resultat
                   
    def store_data(self, analyse_resultat):
        """ Sauvegarder les résultats de l'analyse dans un fichier
        Args:
            analyse_resultat(dict): Analyse des erreurs faites par LLM
        """
        # Create the file with empty structure if it doesn't exist
        try:
            with open(f"Student_DB/{self.store_file}", "x", encoding="utf-8") as f:
                json.dump({}, f)
        except FileExistsError:
            pass  # File already exists, which is fine
        
        with open(f"Student_DB/{self.store_file}","r+", encoding="utf-8") as f:
            store_file = json.load(f)
            if "rapports_production_ecrite" not in store_file:
                store_file["student_id"] = f"{self.student_id}"
                store_file["rapports_production_ecrite"] = []
# Create a new report object and append it to the array
            new_report = {
                "date": f"{datetime.datetime.now()}",
                "rapport": analyse_resultat
            }
            store_file["rapports_production_ecrite"].append(new_report)
            f.seek(0)
            f.truncate()
            json.dump(store_file,f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    print("Analyser initialisation")
    Error_Analyser = Analyser("dominika")
    Error_Analyser.load_filter_file(f"Student_DB/{Error_Analyser.student_id}.json")
    print("\n")
    Analyse_repport = Error_Analyser.error_analyse(Error_Analyser.filedata)
    Error_Analyser.store_data(Analyse_repport)