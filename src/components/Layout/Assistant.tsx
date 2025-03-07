import Image  from "next/image"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { setIsSideBarExpanded, setAssistantInput } from "@/store/slices/globalSlice"
import "@/styles/assistant.scss"
import { ChangeEvent, useEffect, useState } from "react"
import { Message } from "@/types/assistant"
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { addThreadId, setCurrentThreadId } from "@/store/slices/assistantSlice"
import { MessageType } from "@/utils/enums"


const AIMessage = (props: { message: Message }) => {
  return (
    <article className="ai-message">
      <Markdown remarkPlugins={[remarkGfm]}>{props.message.content}</Markdown>
    </article>
  )
}

const UserMessage = (props: { message: Message }) => {
  return (
    <article className="user-message">
      <p>{props.message.content}</p>
    </article>
  )
}


const Assistant = () => {
  const dispatch = useDispatch() // for redux state manipulations
  const isInitialized = useSelector((state: RootState) => state.global.isInitialized); // initial loading state
  const isAssistantExpanded = useSelector((state: RootState) => state.global.isAssistantExpanded);
  const threadId = useSelector((state: RootState) => state.assistant.currentThreadId);
  const [conversation, setConversation] = useState<Message[]>([]);
  const assistantInput = useSelector((state: RootState) => state.global.assistantInput);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setAssistantInput(e.target.value));
  }

  const handleAssistantToggle = () => {
    dispatch(setIsSideBarExpanded(!isAssistantExpanded));
  }

  const handleSendMessage = async () => {
    const messages = [assistantInput];
    dispatch(setAssistantInput(""));

    // append new user message to the conversation
    setConversation((prev) => [...prev, { role: MessageType.HUMAN, content: assistantInput }]);


    // send message to backend
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages, threadId }),
    });

    if (!response.ok || !response.body) {
      console.error("Failed to send message to backend");
      dispatch(setAssistantInput(assistantInput)); // restore input
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // append a new assistant message to the conversation first
    setConversation((prev) => [...prev, { role: MessageType.AI, content: "" }]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // update the last message with the new chunk
      // Handle SSE events in the chunk
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue; // skip event for now

        const eventData = line.substring(6); // remove 'data: ' prefix

        try {
          // try to parse as JSON if it's a JSON event
          const parsedData = JSON.parse(eventData);

          if (!parsedData.content || !parsedData.metadata || !parsedData.metadata.thread_id) {
            throw new Error("Invalid event data");
          }

          if (!threadId) { // new conversation
            dispatch(setCurrentThreadId(parsedData.metadata.thread_id));
            dispatch(addThreadId(parsedData.metadata.thread_id));

          } else if (threadId !== parsedData.metadata.thread_id) {
            throw new Error(`Thread ID mismatch: ${threadId} !== ${parsedData.metadata.thread_id}`);
          }
          
          // append to the last message
          setConversation((prev) => [...prev.slice(0, -1), { 
            role: MessageType.AI, 
            content: prev[prev.length - 1].content + parsedData.content 
          }]);
        } catch (e) {
          console.error(e);
          break;
        }
      
      }
    }
  }

  // load the conversation history from the backend
  useEffect(() => {
    if (!threadId) return;

    const fetchConversation = async () => {
      const response = await fetch(`/api/chat/${threadId}`);
      const data: { messages: Message[], threadId: string } = await response.json();
  
      if (!response.ok || !data) {
        console.error("Failed to fetch thread history");
        return;
      }
  
      setConversation(data.messages);
      dispatch(setCurrentThreadId(data.threadId));
    }

    fetchConversation();
  }, [threadId])

  return (
    <>
      <div className={`assistant-toggle ${isAssistantExpanded ? '' : 'folded'}`} onClick={handleAssistantToggle}>
        <Image 
          src="/expand.svg" 
          alt="sidebar-toggle" 
          width={10} 
          height={10}
          className={(isAssistantExpanded ? '' : 'icon-folded')} 
        />
      </div>
      <div className={`assistant ${isAssistantExpanded ? '' : 'folded'}`} id="assistant">
        <div className="conversation-container">
          {conversation.map((message, index) => (
            <div key={index}>
              {message.role === MessageType.HUMAN ? <UserMessage message={message} /> : <AIMessage message={message} />}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input 
            id="search-input"
            type="text"
            value={assistantInput}  
            onChange={handleInputChange} 
            placeholder="Ask me anything!"
            disabled={!isInitialized}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <Image 
            src="/send.svg" 
            alt="send" 
            width={20} 
            height={20} 
            className="send-icon"
            onClick={handleSendMessage}
          />
        </div>
      </div>
    </>
  )
}

export default Assistant