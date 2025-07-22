import DeleteIcon from "@/public/icons/delete.svg";
import clsx from "clsx";

const FootNote = ({
  content,
  handleClick,
  handleDelete,
}: {
  content: string;
  handleClick?: () => void;
  handleDelete?: () => void;
}) => {
  return (
    <div
      className={clsx("foot-note", handleClick && "clickable")}
      onClick={handleClick}
    >
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
