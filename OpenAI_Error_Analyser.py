"""
Tool analyse messages from a provided json file and produce an analysis with 
grammar and style errors stored in a separate file 
"""
import json
import openai
from clients import client_gpt_4o
from Pinecone_tool import pinecone_db

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

    def error_analyse(self,text):
        """ Here we analyse grammar and style errors 
        Args:
            text(dict): the text that 
        Return:
            analyse_resultat(dict): analyse des erreurs faite par LLM
        """

        system_prompt = f"""
        Analysez ce texte français et identifiez les erreurs de grammaire et de style. 
        Répondez UNIQUEMENT dans ce format exact:
        
        {{
            "erreurs_grammaire": "description des erreurs de grammaire trouvées",
            "erreurs_style": "description des erreurs de style trouvées"
        }}
        Texte à analyser:
        {text}
        Analyse doit être fait en français et ne doit pas commencer par ```json
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

    for i, conversation in enumerate(Error_Analyser.filedata["conversations"]):
        message_id = conversation["message_id"]
        if "erreurs_grammaire" not in conversation:
            print(f"✅ No analysis found for {message_id}. Starting analysis...")
            analyse_resultat=Error_Analyser.error_analyse(conversation["message"])
            parsed_analyse=json.loads(analyse_resultat)
            Error_Analyser.parse_analyse(parsed_analyse)
            Error_Analyser.store_data("analysis_results.json", conversation)

        vectore_database.create_index("dominika", message_id, conversation["erreurs_grammaire"],"erreurs_grammaire","erreurs_grammaire")
        vectore_database.create_index("dominika", message_id, conversation["erreurs_style"],"erreurs_style","erreurs_style")
                            
    query = "Montre moi les erreurs de grammaire"
    vectore_database.query(Error_Analyser.student_id,query,"erreurs_grammaire")