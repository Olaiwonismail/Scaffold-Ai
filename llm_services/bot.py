from tools.model import model
from tools.dynamic_prompt import prompt_with_context,get_lessons,get_quiz

from langchain.agents import create_agent

agent = create_agent(model, tools=[], middleware=[prompt_with_context])
tutor_agent = create_agent(model, tools=[], middleware=[get_lessons])
quiz_agent = create_agent(model ,tools=[],middleware=[get_quiz])
# query ="""what is Poiseuilles law """
async def ask_chatbot(query : str):
    print(query)
    response = agent.invoke(
    {"messages": [{"role": "user", "content": query}]}
    )
    return response['messages'][1].content
# def tutor(query : str):

#     for step in tutor_agent.stream(
#         {"messages": [{"role": "user", "content": query}]},
#         stream_mode="values",
#     ):
#         step["messages"][-1].pretty_print()
async def tutor(query: str,adapt:str,analogy:str):
    query= f'Act as a tutur the user understanding out of ten is {adapt} where 10 is firm grasp of the concept and 0 is absolutely no idea what the concept is for analogy here is some info about the user {analogy}  if no info is pprovided use a suitable one {query}'
    result = tutor_agent.invoke(
        {"messages": [{"role": "user", "content": query}]}
    )
    msgs = result["messages"]
    return msgs[-1].content

async def quiz(query: str):
    result = quiz_agent.invoke(
        {"messages": [{"role": "user", "content":{query}}]}
    )
    msgs = result["messages"]
    return msgs[-1].content

