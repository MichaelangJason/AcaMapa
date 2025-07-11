import type { EnhancedRequisites } from "@/types/local";

const ReqNotes = ({
  title,
  requisites,
  notes = [],
}: {
  title: string;
  requisites?: EnhancedRequisites;
  notes?: string[];
}) => {
  return (
    <div className="req-note">
      <header>{title}:</header>
      {requisites?.group && (
        <section className="parsed">{JSON.stringify(requisites.group)}</section>
      )}
      <ul className="notes">
        {requisites?.raw && <li>{requisites.raw}</li>}
        {notes.map((note, idx) => (
          <li key={idx}>{note}</li>
        ))}
      </ul>
    </div>
  );
};

export default ReqNotes;
