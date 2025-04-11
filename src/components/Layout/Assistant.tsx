import Image  from "next/image"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { setAssistantInput, setIsToastEnabled } from "@/store/slices/globalSlice"
import "@/styles/assistant.scss"
import "@/styles/dropdown.scss"
import { ChangeEvent, useEffect, useState, useRef } from "react"
import { Message, MessageChunk   } from "@/types/assistant"
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { addNewMessage, addThreadId, updateLastMessage, clearMessages, setCurrentThreadId, setMessages, removeThreadId } from "@/store/slices/assistantSlice"
import { MessageType } from "@/utils/enums"
import * as DM from '@radix-ui/react-dropdown-menu'
import { isAppliablePlan } from "@/utils/typeGuards"
import { addPlan, setCurrentPlanId, setPlanTermIds } from "@/store/slices/planSlice"
import { Course } from "@/types/course"
import { setCoursesData } from "@/store/slices/courseSlice"
import { toast } from "react-toastify"
import { addCourseToTerm, addTerm } from "@/store/slices/termSlice"
import { v4 as uuidv4 } from 'uuid';


const AIMessage = (props: { message: Message, isStreaming?: boolean }) => {
  const dispatch = useDispatch();
  // console.log("AIMessage: ", props.message.content);
  return (
    <article className="ai-message">
      <Markdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({node, ...props}) => {
            const content = node?.children[0];
            const handleApply = async(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
              let resolveApply: Function = () => {};
              // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
              let rejectApply: Function = () => {};
              try {
                const json = JSON.parse((content as any)?.value);
                if (!isAppliablePlan(json)) {
                  toast.error("Not Appliable Plan");
                  return;
                };
                const promise = new Promise((resolve, reject) => {
                  resolveApply = resolve;
                  rejectApply = reject;
                });

                toast.promise(promise, {
                  pending: "Applying plan...",
                  error: "Failed to apply plan",
                  success: "Plan applied successfully"
                });

                const plan = json;
                dispatch(setIsToastEnabled(false));

                // console.log("plan: ", plan);

                const courseIds = Object.values(plan.terms)
                  .flatMap(term => term.course_ids.map(id => id.toLowerCase().replaceAll(" ", "").trim()));

                const courses = await fetch('/api/courses', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ courseIds: Array.from(courseIds) })
                })

                if (!courses.ok) {
                  console.error(courses);
                  console.error(courses.status);
                  throw new Error("Failed to fetch courses");
                }

                const courseData = await courses.json() as Course[];
                // console.log("courseData: ", courseData);
                dispatch(setCoursesData(courseData));
                
                const planId = "plan-" + uuidv4();
                // add a new plan, but don't set it as the current plan
                dispatch(addPlan({ notSetCurrent: true, id: planId }));

                const terms = Object.values(plan.terms).map(term => {
                  return {
                    id: "term-" + uuidv4(),
                    name: term.name,
                    courseIds: term.course_ids.map(id => id.toLowerCase().replaceAll(" ", "").trim()),
                  }
                });

                // console.log("terms: ", terms);

                terms.forEach(term => {
                  dispatch(addTerm({ termId: term.id, termName: term.name, planId, notAddToOrder: true }));
                  term.courseIds.forEach(courseId => {
                    if (!courseData.find(course => course.id === courseId)) {
                      toast.error(`Course ${courseId} not found`);
                      return;
                    }
                    dispatch(addCourseToTerm({ termId: term.id, courseId, notAddToInTermCourseIds: true }));
                  });
                });

                dispatch(setPlanTermIds({ planId, termIds: terms.map(term => term.id) }));
                // dispatch(setIsToastEnabled(true));
                dispatch(setCurrentPlanId(planId));
              } catch (e) {
                // console.error(e);
                toast.error("Not Appliable Plan");
                rejectApply(e);
              } finally {
                resolveApply();
                dispatch(setIsToastEnabled(true));
              }
            };
            
            return (
              <>
                <div className={"apply-header"} onClick={handleApply}>
                  <p>Add as New Plan</p>
                </div>
                <code {...props} className="appliable-code">
                  {props.children}
                </code>
              </>
            )
          }
        }}
      >{props.message.content.trim()}</Markdown>
      {props.isStreaming && (
        <div className="streaming-indicator">
          <div className="pulse-circle"></div>
        </div>
      )}
    </article>
  )
}

const UserMessage = (props: { message: Message }) => {
  return (
    <article className="user-message">
      <p>{props.message.content}</p>
      {props.message.options && props.message.options.map((option) => (
        <button key={option} className="option-button">
          {option}
        </button>
      ))}
    </article>
  )
}

const History = () => {
  // const [open, setOpen] = useState(false);
  const threadIds = useSelector((state: RootState) => state.assistant.threadIds);
  const dispatch = useDispatch();

  const handleSwitchThread = async (threadId: string) => {
    const response = await fetch(`/api/chat/${threadId}`);
      
    if (!response.ok) {
      console.error("Failed to fetch thread history");
      return;
    }
    
    const data: { messages: Message[], threadId: string } = await response.json();

    if (!data.messages || !data.threadId) {
      console.error("Invalid thread history");
      return;
    }

    dispatch(setMessages(data.messages));
    dispatch(setCurrentThreadId(data.threadId));
  }

  const handleDeleteThread = async (e: React.MouseEvent<HTMLDivElement>, threadId: string) => {
    e.stopPropagation();
    dispatch(removeThreadId(threadId));
  }

  return (
    <DM.Root modal={false}>
      <DM.Trigger className="dropdown-menu-trigger">
        <Image src="/history.svg" alt="history" width={20} height={20} />
      </DM.Trigger>
      <DM.Portal>
        <DM.Content className="dropdown-menu-content" 
            align='start' 
            sideOffset={8} 
        >
          {threadIds.map((threadId) => (
            <DM.Item 
              className="dropdown-menu-item" 
              key={threadId} 
              onClick={() => handleSwitchThread(threadId)}
            >
              <p>{threadId}</p>
              <div className="placeholder" style={{ minWidth: '5px'}}/>
              <Image 
                src="/delete.svg" 
                alt="delete" 
                className="delete-icon" 
                width={20} 
                height={20} 
                onClick={(e) => handleDeleteThread(e, threadId)}
              />
            </DM.Item>
          ))}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  )
}


const Assistant = () => {
  const dispatch = useDispatch() // for redux state manipulations
  const isInitialized = useSelector((state: RootState) => state.global.isInitialized); // initial loading state
  const isAssistantExpanded = useSelector((state: RootState) => state.global.isAssistantExpanded);
  const threadId = useSelector((state: RootState) => state.assistant.currentThreadId);
  const messages = useSelector((state: RootState) => state.assistant.messages);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const FIRST_MESSAGE = 
    { // default init message
      role: MessageType.AI,
      content: "Hello! I'm Degma, your academic advisor at McGill. I'm here to help you plan your courses and academic journey.\n\n To get started, could you please let me know which program you're in or interested in? This will help me provide you with the best advice tailored to your needs."
    }
  

  const assistantInput = useSelector((state: RootState) => state.global.assistantInput);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setAssistantInput(e.target.value));
  }

  const handleNewThread = () => {
    dispatch(setCurrentThreadId(null));
    dispatch(clearMessages());
    setIsStreaming(false);
  }

  // const handleAssistantToggle = () => {
  //   dispatch(setIsSideBarExpanded(!isAssistantExpanded));
  // }

  const scrollToBottom = () => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTop = conversationContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const messages = [assistantInput];
    dispatch(setAssistantInput(""));
    
    if (!threadId) {
      // append init message to the conversation first
      dispatch(addNewMessage(FIRST_MESSAGE));
    }
    dispatch(addNewMessage({ role: MessageType.HUMAN, content: assistantInput }));
    dispatch(addNewMessage({ role: MessageType.AI, content: "" }));

    setIsStreaming(true);

    // send message to ai backend
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages, threadId }),
    });

    if (!response.ok || !response.body) {
      console.error("Failed to send message to backend");
      dispatch(setAssistantInput(assistantInput));
      setIsStreaming(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let addedNewThread = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        setIsStreaming(false);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.substring(7).trim();
          if (eventType === "end_of_stream") {
            setIsStreaming(false);
            break;
          }
        } else if (line.startsWith('data: ')) {
          let eventData = line.substring(6).trim();
          eventData = eventData.replaceAll("'", '"').replaceAll("@@SINGLEQUOTE@@", "'").replaceAll("@@DOUBLEQUOTE@@", '\\\"');

          try {
            const parsedData = JSON.parse(eventData) as MessageChunk;

            if (parsedData.content === undefined || parsedData?.metadata?.thread_id === undefined) {
              throw new Error("Invalid event data: " + eventData);
            }

            if (!addedNewThread) {
              if (!threadId) {
                dispatch(setCurrentThreadId(parsedData.metadata.thread_id));
                dispatch(addThreadId(parsedData.metadata.thread_id));
                addedNewThread = true;
              } else if (threadId !== parsedData.metadata.thread_id) {
                throw new Error(`Thread ID mismatch: ${threadId} !== ${parsedData.metadata.thread_id}`);
              }
            }
            
            dispatch(updateLastMessage({ content: parsedData.content, options: parsedData.options }));
            scrollToBottom();
          } catch (e) {
            console.error(e);
            console.log("Data: ", eventData);
            setIsStreaming(false);
            break;
          }
        }
      } 
    }
  }

  return (
    <>
      {/* <div className={`assistant-toggle ${isAssistantExpanded ? '' : 'folded'}`} onClick={handleAssistantToggle}>
        <Image 
          src="/expand.svg" 
          alt="sidebar-toggle" 
          width={10} 
          height={10}
          className={(isAssistantExpanded ? '' : 'icon-folded')} 
        />
      </div> */}
      <div className={`assistant ${isAssistantExpanded ? '' : 'folded'}`} id="assistant">
        <div className="options-container">
          <div className="title">McGill DegreeMapper</div>
          <div className="placeholder"/>
          <Image 
            src="/add.svg" 
            alt="add" 
            width={20} 
            height={20} 
            style={{ cursor: 'pointer' }} 
            onClick={handleNewThread}
          />
          <History />
        </div>
        <div className="conversation-container" ref={conversationContainerRef}>
          {(messages.length > 0 ? messages : [FIRST_MESSAGE]).map((message, index) => (
            <div key={index}>
              {message.role === MessageType.HUMAN ? <UserMessage message={message} /> : <AIMessage 
                message={message} 
                isStreaming={isStreaming && index === messages.length - 1} 
              />}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input 
            id="assistant-input"
            type="text"
            value={assistantInput}  
            onChange={handleInputChange} 
            placeholder="Ask me anything!"
            disabled={!isInitialized || isStreaming}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isStreaming) {
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
            style={{ cursor: isStreaming ? 'not-allowed' : 'pointer', opacity: isStreaming ? 0.5 : 1 }}
          />
        </div>
      </div>
    </>
  )
}

export default Assistant