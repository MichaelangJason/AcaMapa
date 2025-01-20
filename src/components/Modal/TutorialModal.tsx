import { RootState } from "@/store";
import { setIsTutorialModalOpen } from "@/store/slices/globalSlice";
import Modal from "react-modal";
import { useDispatch, useSelector } from "react-redux";
import '@/styles/modals.scss';
import { motion } from "motion/react";
import Markdown from "react-markdown";

Modal.setAppElement('body');

const TutorialModal = () => {
  const isTutorialModalOpen = useSelector((state: RootState) => state.global.isTutorialModalOpen);
  const dispatch = useDispatch();
  const closeModal = () => {
    dispatch(setIsTutorialModalOpen(false));
  }

  return (
    <Modal 
      isOpen={isTutorialModalOpen} 
      onRequestClose={closeModal}
      // ariaHideApp={true}
      // className="modal-basic"
      style={{
        overlay: {
          zIndex: 1000
        }
      }}
    >
      <motion.div 
        className="modal-basic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Markdown>
          {`
          # Tutorial
          ## How to use the Course Planner
          `.trim()}
        </Markdown>
      </motion.div>
    </Modal>
  )
}

export default TutorialModal;
