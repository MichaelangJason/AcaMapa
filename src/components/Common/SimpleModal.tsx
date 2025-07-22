import Modal from "react-modal";
import { useState } from "react";
import DeleteIcon from "@/public/icons/delete.svg";
import type { SimpleModalProps } from "@/types/local";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearSimpleModalInfo } from "@/store/slices/localDataSlice";

Modal.setAppElement("html");

const SimpleModal = () => {
  const dispatch = useAppDispatch();
  const {
    title = "",
    description = "",
    confirmCb = () => {},
    closeCb = () => {},
    previousValue = "",
    isOpen,
  } = useAppSelector(
    (state) => state.localData.simpleModalInfo,
  ) as SimpleModalProps;

  const [newValue, setNewValue] = useState("");

  const handleClose = () => {
    closeCb();
    dispatch(clearSimpleModalInfo());
  };

  const handleConfirm = () => {
    confirmCb(newValue);
    closeCb();
    dispatch(clearSimpleModalInfo());
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="simple-modal-content"
      overlayClassName="modal-overlay"
    >
      <header>
        <h3>{title}</h3>
        <button onClick={handleClose}>
          <DeleteIcon />
        </button>
      </header>

      {description && <p>{description}</p>}

      {previousValue && (
        <input
          type="text"
          placeholder={previousValue}
          onChange={(e) => setNewValue(e.target.value)}
          autoFocus
        />
      )}

      <footer>
        <button className="cancel-button" onClick={handleClose}>
          Cancel
        </button>
        <button className="confirm-button" onClick={handleConfirm}>
          Confirm
        </button>
      </footer>
    </Modal>
  );
};

export default SimpleModal;
