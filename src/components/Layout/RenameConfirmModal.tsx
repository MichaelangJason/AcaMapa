import Modal from "react-modal";
import { ModalType } from "@/utils/enums";
import { useState } from "react";
import '@/styles/modal.scss';
import Image from "next/image";
export interface RenameConfirmModalInfo {
  type: ModalType;
  closeCb: () => void;
  confirmCb: (newValue: string) => void | (() => void);
  text: string;
}

const RenameConfirmModal = (props: { modalInfo: RenameConfirmModalInfo }) => {
  const { modalInfo } = props;

  const { type, confirmCb, closeCb, text } = modalInfo;

  const [newValue, setNewValue] = useState("");

  const handleConfirm = () => {
    confirmCb(newValue);
    closeCb();
  }

  return (
    <Modal 
      isOpen={true} 
      onRequestClose={closeCb}
      className='rename-confirm-modal-content'
      overlayClassName='rename-confirm-modal-overlay'
    >

        <header>
          <h3>{type === ModalType.DELETE ? "Delete" : "Rename"}</h3>
          <button onClick={closeCb}>
            <Image src="delete.svg" alt="close" width={10} height={10} />
          </button>
        </header>

        {type === ModalType.DELETE ? (
          <p>Are you sure you want to delete <span className="value">{text}</span>?</p>
        ): (
          <p>Please enter the new name for <span className="value">{text}</span>.</p>
        )}

        {type === ModalType.RENAME && (
          <input 
            type="text" 
            placeholder={text} 
            onChange={(e) => setNewValue(e.target.value)}
            autoFocus
          />
        )}

        <footer>
          <button onClick={closeCb}>Cancel</button>
          <button className="confirm-button" onClick={handleConfirm}>Confirm</button>
        </footer>


    </Modal>
  )
}

export default RenameConfirmModal;