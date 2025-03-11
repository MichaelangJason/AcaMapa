/* eslint-disable @typescript-eslint/no-unused-vars */
import Modal from "react-modal";
import React, { useEffect, useState, useRef } from "react";
import '@/styles/modal.scss';
import Image from "next/image";

import remarkGfm from "remark-gfm";
import "@/styles/modal.scss";
import Markdown from "react-markdown";
import remarkToc from "remark-toc";


export interface InfoModalProps {
  tabs: {
    title: string;
    src: string;
  }[];
  onClose: () => void;
}

const InfoModal = (props: InfoModalProps) => {
  const { tabs, onClose } = props;

  const [currentTab, setCurrentTab] = useState(0);
  const [markdownSource, setMarkdownSource] = useState("");
  const [headings, setHeadings] = useState<{id: string, text: string, level: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(tabs[currentTab].src)
      .then(res => res.text())
      .then(text => {
        setMarkdownSource(text);
        
        // extract headings for TOC
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const extractedHeadings: {id: string, text: string, level: number}[] = [];
        
        let match;
        while ((match = headingRegex.exec(text)) !== null) {
          const level = match[1].length;
          const text = match[2].trim();
          const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          
          extractedHeadings.push({ id, text, level });
        }
        
        setHeadings(extractedHeadings);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching markdown:", error);
        setIsLoading(false);
      });
  }, [currentTab, tabs]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      className="info-modal-content"
      overlayClassName="common-overlay"
      ariaHideApp={false} 
    >
      <button className="close-button" onClick={onClose}>
        <Image 
          src="/delete.svg" 
          alt="Close" 
          width={16} 
          height={16} 
        />
      </button>
      <div className="modal-container">
        <div className="toc-sidebar">
          {tabs.length > 1 && (
            <div className="tab-selector">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  className={`tab-button ${currentTab === index ? 'active' : ''}`}
                  onClick={() => setCurrentTab(index)}
                >
                  {tab.title}
                </button>
              ))}
            </div>
          )}
          <h2>Table of Contents</h2>
          <div className="toc-links">
            {isLoading ? (
              <div className="loading-toc">Loading...</div>
            ) : headings.length > 0 ? (
              headings.map((heading, index) => (
                <div 
                  key={index} 
                  className={`toc-link level-${heading.level}`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  {heading.text}
                </div>
              ))
            ) : (
              <div className="no-headings">No headings found</div>
            )}
          </div>
        </div>
        <div className="content-area" ref={contentRef}>
          {isLoading ? (
            <div className="loading-content">Loading content...</div>
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm, [remarkToc, { tight: true }]]}
              components={{
                img: ({src, alt}) => {
                  return(
                    <Image
                      src={src!.startsWith('.') ? src!.slice(1) : src!}
                      alt={alt!}
                      width={2000}
                      height={1250}
                      loading="lazy"
                      unoptimized={src!.endsWith('.gif')}
                    />
                  )
                },
                // node is an unwanted prop
                h1: ({node, ...props}) => <h1 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
                h2: ({node, ...props}) => <h2 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
                h3: ({node, ...props}) => <h3 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
                h4: ({node, ...props}) => <h4 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
                h5: ({node, ...props}) => <h5 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
                h6: ({node, ...props}) => <h6 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props} />
              }}
            >
              {markdownSource}
            </Markdown>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default InfoModal