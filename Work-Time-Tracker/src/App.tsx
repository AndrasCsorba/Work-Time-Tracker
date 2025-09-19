import "./App.css";
export default function App() {
  return (
    <div
      className="min-h-screen bg-base-200 flex items-center justify-center p-6"
      data-theme="light">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h2 className="card-title">Tailwind + DaisyUI teszt</h2>
          <input
            type="text"
            placeholder="Írj ide..."
            className="input input-bordered w-full"
          />
          <button className="btn btn-primary">Mentés</button>
        </div>
      </div>
    </div>
  );
}
