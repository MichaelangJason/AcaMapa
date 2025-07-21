import DeleteIcon from "@/public/icons/delete.svg";

const FootNote = ({
  content,
  handleDelete,
}: {
  content: string;
  handleDelete?: () => void;
}) => {
  return (
    <div className="foot-note">
      <span>{content}</span>
      {handleDelete && (
        <button className="delete" onClick={handleDelete}>
          <DeleteIcon />
        </button>
      )}
    </div>
  );
};

export default FootNote;
