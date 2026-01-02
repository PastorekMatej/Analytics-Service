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
    
    This class loads student conversation data, sends it to OpenAI's GPT-5 for analysis,
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
            text(str): text to analyze
        Return:
            analyse_resultat(str): Analyse des erreurs faites par LLM
        """
        # Load system prompt from external file
        try:
            with open("backend/system_prompt/prompt_v7.md", "r", encoding="utf-8") as f:
                system_prompt_template = f.read()
        except FileNotFoundError:
            raise FileNotFoundError("System prompt file not found: backend/system_prompt/prompt_v7.md")
        except Exception as e:
            raise Exception(f"Error loading system prompt: {str(e)}")
        
        # Format the prompt with the text parameter
        try:
            system_prompt = system_prompt_template.replace("{text}", text)
        except Exception as e:
            raise Exception(f"Error formatting prompt: {str(e)}")

        print("Launching error analyse")
        messages = [{"role":"system","content":system_prompt}]
        
        try:
            response = self.client.chat.completions.create(model=self.model, messages=messages)
        except Exception as e:
            # If context length exceeded, try with a model that supports larger context
            if "context_length" in str(e).lower() or "8192" in str(e):
                # Try alternative GPT-5 models with larger context windows
                alternative_models = ["gpt-5-chat-latest", "gpt-5.2-chat-latest", "gpt-5.2-pro", "gpt-5-pro"]
                for alt_model in alternative_models:
                    if alt_model != self.model:
                        try:
                            response = self.client.chat.completions.create(model=alt_model, messages=messages)
                            # Success with alternative model
                            break
                        except Exception as alt_e:
                            # Continue to next alternative
                            continue
                else:
                    # All alternatives failed, re-raise original error
                    print(f"Error calling OpenAI API: {type(e).__name__}: {str(e)}")
                    raise
            else:
                # Not a context length error, re-raise
                print(f"Error calling OpenAI API: {type(e).__name__}: {str(e)}")
                raise
        
        # Safely extract the response content
        try:
            if not response or not hasattr(response, 'choices'):
                raise ValueError("Invalid response structure: missing 'choices'")
            
            if not response.choices or len(response.choices) == 0:
                raise ValueError("Invalid response structure: empty 'choices' array")
            
            choice = response.choices[0]
            if not hasattr(choice, 'message') or not choice.message:
                raise ValueError("Invalid response structure: missing 'message' in choice")
            
            if not hasattr(choice.message, 'content') or choice.message.content is None:
                raise ValueError("Invalid response structure: missing 'content' in message")
            
            analyse_resultat = choice.message.content
            print(f"Resultat de l'analyse: {len(analyse_resultat) if analyse_resultat else 0} characters")
            return analyse_resultat
        except (KeyError, AttributeError, IndexError) as e:
            error_msg = f"Error parsing OpenAI response: {type(e).__name__}: {str(e)}"
            print(error_msg)
            # Try to get more info about the response structure
            try:
                print(f"Response type: {type(response)}")
                print(f"Response attributes: {dir(response)}")
                if hasattr(response, 'choices'):
                    print(f"Choices length: {len(response.choices) if response.choices else 0}")
            except:
                pass
            raise ValueError(error_msg)
                   
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