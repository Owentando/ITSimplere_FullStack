
function DocumentCard(props) {
    return (
        <div className="document-card">
            <div className="document-card-top">
                <div className="document-icon">
                    {props.type === "Code Editor" ? "{" : "▱"}
                </div>

                <span className="document-type">
                    {props.type}
                </span>
            </div>

            <h3>{props.title}</h3>

            <p className="document-description">
                {props.type === "Code Editor"
                    ? "Collaborative coding workspace"
                    : "Collaborative whiteboard workspace"}
            </p>

            <div className="document-card-footer">
                <span className="document-role">
                    {props.userRole}
                </span>

                <div className="document-buttons">
                    <button
                        className="open-button"
                        onClick={() => props.onEdit(props.id)}
                    >
                        Open
                    </button>

                    {props.userRole === "Owner" && (
                        <button
                            className="delete-button"
                            onClick={() => props.onDelete(props.id)}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DocumentCard;
