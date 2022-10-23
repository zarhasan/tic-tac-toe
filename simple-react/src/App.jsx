import { useEffect, useMemo, useState } from "react";
import { tw } from "twind";
import { Peer } from "peerjs";

function App() {
  const solutions = [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [1, 4, 7],
    [2, 5, 8],
    [2, 4, 6],
    [3, 4, 5],
    [6, 7, 8],
  ];
  const tiles = new Array(9).fill(null);

  const [winner, setWinner] = useState(null);
  const [solution, setSolution] = useState([]);
  const [turn, setTurn] = useState("X");
  const [values, setValues] = useState(tiles);
  const [user, setUser] = useState(null);

  const peer = useMemo(() => {
    if (!user) {
      return null;
    }
    return new Peer();
  }, [user]);

  peer?.on("open", function (id) {
    console.log("My peer ID is: " + id);
  });

  function handleReset() {
    setTurn("X");
    setValues(tiles);
    setWinner(null);
    setSolution([]);
  }

  return (
    <div className="h-full min-h-screen flex flex-col justify-center items-center">
      <form className="w-96 h-12 flex justify-center items-center bg-gray-50 mb-8 border-2">
        <input
          className="flex-grow h-full outline-none"
          type="email"
          name=""
          id=""
        />
        <button>Submit</button>
      </form>
      <div className="w-96 mb-8 grid grid-cols-2 gap-4">
        <p className="flex flex-col justify-center items-center text-center bg-gray-50 p-6 rounded-lg">
          <span className="font-semibold text-sm text-gray-600">Turn</span>
          <span className="text-2xl font-semibold">{turn}</span>
        </p>
        <p className="flex flex-col justify-center items-center text-center bg-gray-50 p-6 rounded-lg">
          <span className="font-semibold text-sm text-gray-600">Winner</span>
          <span className="text-2xl font-semibold">{winner || "-"}</span>
        </p>
      </div>

      <Board
        winner={winner}
        setWinner={setWinner}
        solution={solution}
        setSolution={setSolution}
        values={values}
        setValues={setValues}
        solutions={solutions}
        turn={turn}
        setTurn={setTurn}
      />

      <div className="flex justify-center">
        <button
          className="bg-gray-100 rounded-full px-4 py-2 font-semibold mt-8"
          onClick={handleReset}
        >
          Reset Board
        </button>
      </div>
    </div>
  );
}

const Board = ({
  solutions,
  values,
  setValues,
  turn,
  setTurn,
  winner,
  setWinner,
  solution,
  setSolution,
}) => {
  const handleTileClick = (index) => {
    if (values[index] || winner) {
      return;
    }

    const newData = values;
    newData[index] = turn;

    setValues(newData);
    setTurn(turn === "X" ? "O" : "X");

    solutions.forEach((solution) => {
      if (
        values[solution[0]] &&
        values[solution[0]] === values[solution[1]] &&
        values[solution[0]] === values[solution[2]]
      ) {
        setSolution(solution);
        setWinner(values[solution[0]]);
      }
    });
  };

  return (
    <div className="w-96 grid grid-cols-3 gap-4">
      {values.map((value, index) => {
        return (
          <button
            disabled={winner || value}
            className={`border-2 border-gray-200 h-24 rounded-lg font-semibold flex justify-center items-center text-xl disabled:text-gray-500 disabled:bg-gray-100 ${
              solution.includes(index) &&
              tw("!bg-green-100 !text-green-600 !border-green-200")
            }`}
            key={index}
            onClick={(e) => handleTileClick(index)}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
};

export default App;
