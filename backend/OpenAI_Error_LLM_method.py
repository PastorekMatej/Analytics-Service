"""
For a specific student take JSON file with raw data and inject it directly to LLM request
"""
import json
from openai import OpenAI
from .clients import client_gpt_5
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
        self.client, self.model = client_gpt_5()
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
        RÔLE

            Tu es un assistant pédagogique expert en langue française, spécialisé dans l’analyse
            linguistique des productions écrites d’apprenants non francophones.
            Tu connais les catégories officielles d’erreurs utilisées en didactique du FLE.

            MISSION

            Analyse le texte suivant : {text}
            Ce texte est écrit par un étudiant slovaque apprenant le français.

            Ton objectif est :

            D’identifier uniquement les erreurs récurrentes (patterns répétés plusieurs fois dans le texte).

            D’analyser les tendances d’évolution linguistique (progrès, stabilité, erreurs persistantes).

            De formuler une conclusion synthétique sur l’évolution globale des compétences de l’étudiant.

            Section ERREURS_RÉCURRENTES repère uniquement les régularités significatives et 
            répetitives. Les patternes de la section du rapport
            Les erreurs listées dans la section ERREURS_RÉCURRENTES doivent apparître dans les textes au moins 2 fois
            Utilise les types uniformes listés ci-dessous.

            📘 CLASSIFICATION UNIFIÉE DES PATTERNS D’ERREURS (pour prompt)
            🧩 GRAMMAIRE
            Code	Nom du pattern	Description concise	Exemple
            G01	Accord du participe passé avec avoir	Mauvais accord du participe passé avec l’auxiliaire avoir.	J’ai passée la nuit → J’ai passé la nuit
            G02	Accord du participe passé avec être	Accord incorrect du participe passé avec être.	Elles sont parti → Elles sont parties
            G03	Erreur de négation	Mauvais placement ou omission du ne.	Je n’ai connu pas → Je ne connais pas
            G04	Confusion passé composé / imparfait	Usage inapproprié des temps du passé.	Quand j’étais petit, j’ai jouais au foot → je jouais
            G05	Accord sujet-verbe	Désaccord entre sujet et verbe.	Les gens mange → Les gens mangent
            G06	Utilisation incorrecte des prépositions	Préposition inappropriée.	Travailler en Slovaquie → Travailler en Slovaquie / dans une entreprise
            G07	Mauvais emploi des articles	Erreur dans le choix d’article défini/indéfini/partitif.	J’aime un musique → J’aime la musique
            G08	Ordre incorrect des mots	Mauvaise position des éléments dans la phrase.	Je mange souvent le pain → Je mange le pain souvent
            G09	Confusion des temps composés	Mauvais emploi de temps composés (plus-que-parfait, futur antérieur, etc.).	Quand je suis arrivé, il a déjà parti → il était déjà parti
            G10	Usage fautif du subjonctif ou conditionnel	Mauvaise formation ou emploi du mode.	Il faut que je vais → Il faut que j’aille
            🧩 VOCABULAIRE
            Code	Nom du pattern	Description concise	Exemple
            V01	Faux amis / calques du slovaque	Mot français mal choisi par traduction directe du slovaque.	Défises → Défis
            V02	Mauvais choix de mot (registre / nuance)	Terme correct mais inadapté au contexte.	Un mec formidable (registre familier) → Un homme formidable
            V03	Répétition lexicale excessive	Usage trop fréquent du même mot.	C’était très bien, bien organisé, bien préparé → varier le vocabulaire
            V04	Collocation non naturelle	Association de mots atypique en français.	Faire un photo → Prendre une photo
            V05	Interférence linguistique (structure slovaque)	Expression influencée par la syntaxe maternelle.	Je me rappelle de ça → Je me le rappelleType	Description

            🧩 STYLE
            Code	Nom du pattern	Description concise	Exemple
            S01	Coordination excessive	Trop d’éléments reliés par et, mais, puis.	J’ai visité Paris et j’ai vu la Tour Eiffel et j’ai mangé…
            S02	Phrases trop longues / mal ponctuées	Enchaînements sans respiration syntaxique.	Phrase de 5 lignes sans point → scinder en deux phrases.
            S03	Registre inadapté	Niveau de langue inapproprié (trop familier ou trop formel).	C’est nul ce truc → Ce n’est pas satisfaisant
            S04	Manque de cohérence logique	Mauvais enchaînement des idées.	J’aime le café. Donc, j’ai acheté un chat.
            S05	Formulation maladroite / lourde	Phrase correcte mais peu fluide ou redondante.	C’est quelque chose que je veux faire depuis longtemps déjà → Je veux le faire depuis longtemps


            Section RREURS_PERSISTANTES repère uniquement les 10 erreurs les plus fréquents des 3 dernières textes - leçons

            🧾 EXEMPLE DE SORTIE

            ÉVOLUTION_GLOBALE:
                évolution de niveau: "A2 → B1+"
                résumé: >
                L’étudiant progresse en complexité grammaticale et en style,
                mais conserve quelques erreurs d’accord et de coordination.


            ERREURS_RÉCURRENTES:
            GRAMMAIRE:
                - type: G01
                pattern: Accord du participe passé avec "avoir"
                occurrences: 2
                exemples:
                    - "j’ai passée la nuit" → "j’ai passé la nuit"
                    - "nous avons finies nos études" → "nous avons fini nos études"
                
                - type: G07
                pattern: Mauvais emploi des articles
                occurrences: 4
                exemples:
                    - "Je habite dans Prague" → "J'habite à Prague"
                    - "J'ai un rêve de visiter Paris" → "J'ai le rêve de visiter Paris"

                - type: G05
                pattern: Accord sujet-verbe
                occurrences: 3
                exemples:
                    - "Je regarder les films français" → "Je regarde les films français"
                    - "Mon famille pense" → "Ma famille pense"
                    - "Mon petite frère" → "Mon petit frère"


                - type: G03
                pattern: Erreur de négation
                occurrences: 10
                exemples:
                    - "je n’ai connu pas" → "je ne connais pas"

            VOCABULAIRE:
                - type: V01
                pattern: Faux amis / calques du slovaque
                occurrences: 2
                exemples:
                    - "défises" → "défis"
                    - "avanture d’adrénaline" → "aventure pleine d’adrénaline"

                - type: V03
                pattern: Répétition excessive d’un mot
                occurrences: 5
                exemples:
                    - "Je veux parler français bien parce que je veux voyager" → "car je souhaite voyager"
                    - "Nous avons beaucoup parlé et nous avons ri beaucoup" → "et beaucoup ri"

                - type: V05
                pattern: Interférences linguistiques (traduction littérale)
                occurrences: 2
                exemples:
                    - "je suis allé au cinéma" → "nous sommes allés au cinéma"
                    - "j'ai tombé" → "je suis tombé"



            STYLE:
                - type: S01
                pattern: Coordination excessive
                occurrences: 2
                exemples:
                    - "et", "mais", "puis" utilisés trop souvent
                    - phrase : "J’ai visité Paris et j’ai vu la Tour Eiffel et j’ai mangé un croissant"

                - type: S05
                pattern: Construction maladroite ou peu fluide
                occurrences: 7
                exemples:
                    - "J'ai un rêve de visiter Paris et voir le Tour Eiffel" → "Je rêve de visiter Paris et de voir la Tour Eiffel"
                    - "Je veux parler français bien parce que je veux voyager..." → "Je veux bien parler français pour voyager..."

                - type: S02
                pattern: Phrases trop longues ou mal ponctuées
                occurrences: 3
                exemples:
                    - Phrase longue sans ponctuation claire rendant la lecture difficile
                    - "C'est difficile pour moi mais je essaye beaucoup." → "C'est difficile pour moi, mais j'essaie beaucoup."

            TENDANCES D’ÉVOLUTION :
            - Forte baisse de G05/G08 dès le 2e-3e mois; ces erreurs disparaissent ensuite.
            - G06 et G07 très fréquentes au début, puis nettement mieux maîtrisées à partir du texte_5; plus de traces en fin d’année.
            - Meilleure gestion des temps et des aspects: emploi pertinent du passé composé/imparfait et du conditionnel d’atténuation.
            - Enrichissement stylistique: connecteurs variés (d’un côté/d’un autre côté, de plus, cependant implicite), argumentation claire.



            ERREURS_PERSISTANTES :
                - Accord du participe passé (G01) Exemple: "j'ai tombé" → "je suis tombé" (texte_11) (texte_12)
                - Coordination excessive (S01) Exemple: "j'ai tombé" → "je suis tombé" (texte_11) 
                - Construction maladroite ou peu fluide (S05) Exemple: "j'ai tombé" → "je suis tombé" (texte_12)
                - Mauvais emploi des articles (G07) Exemple: "j'ai tombé" → "je suis tombé" (texte_12)
                - Utilisation incorrecte des prépositions (G06) Exemple: "j'ai tombé" → "je suis tombé" (texte_12)
                - Erreur de négation (G03) Exemple: "j'ai tombé" → "je suis tombé" (texte_12)
                - Accord sujet-verbe (G05) Exemple: "j'ai tombé" → "je suis tombé" (texte_12)

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
    Error_Analyser = Analyser("alexandre")
    Error_Analyser.load_filter_file(f"secure_data/Student_DB/{Error_Analyser.student_id}.json")
    print("\n")
    Analyse_repport = Error_Analyser.error_analyse(Error_Analyser.filedata)
    Error_Analyser.store_data(Analyse_repport)