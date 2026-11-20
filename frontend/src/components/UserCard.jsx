export function UserCard({ usuario }) {
  return (
    <div className="user-card">
      <div className="user-avatar">
        {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : "?"}
      </div>
      <div className="user-info">
        <h3>{usuario.nombre}</h3>
        <span className="user-id">ID: #{usuario.id}</span>
      </div>
    </div>
  );
}
