import Modal from "react-modal";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setIsAboutModalOpen } from "@/store/slices/globalSlice";
import '@/styles/modals.scss';
import { motion } from "motion/react";
Modal.setAppElement('body');

const AboutModal = () => {
  const isAboutModalOpen = useSelector((state: RootState) => state.global.isAboutModalOpen);
  const dispatch = useDispatch();
  const closeModal = () => {
    dispatch(setIsAboutModalOpen(false));
  }

  return (
    <Modal 
      isOpen={isAboutModalOpen} 
      onRequestClose={closeModal}
      // ariaHideApp={true}
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
        <button onClick={closeModal}>Close</button>
        <h1>About</h1>
      </motion.div>
    </Modal>
  )
}

export default AboutModal;