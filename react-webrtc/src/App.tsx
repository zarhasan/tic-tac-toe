import { Html5QrcodeScanner } from 'html5-qrcode';
import { DataConnection, Peer } from 'peerjs';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';

import { Dialog } from '@headlessui/react';

type Player = "X" | "O";

type Board = {
  solutions: [][];
  values: string[];
  setValues(values: string[]): void;
  turn: Player;
  setTurn(turn: Player): void;
  winner: Player;
  setWinner(turn: Player): void;
  solution: number[];
  setSolution(solution: Pick<Board, "solution">): void;
  connection: DataConnection;
  player: Player | null;
};

const peer = new Peer();
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
  const [peerID, setPeerID] = useState<null | string>(null);
  const [connectionID, setConnectionID] = useState<null | string>(null);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [player, setPlayer] = useState<null | "O" | "X">(null);

  console.log(peerID, connectionID);

  useEffect(() => {
    peer?.on("open", function (id) {
      setPeerID(id);
    });

    peer?.on("connection", function (connection) {
      setIsQRCodeOpen(false);
      setConnection(connection);
      setPlayer("X");
    });
  }, []);

  useEffect(() => {
    if (!connectionID) {
      setPlayer("X");
      return;
    }

    setPlayer("O");

    setConnection(peer.connect(connectionID));
  }, [connectionID]);

  useEffect(() => {
    connection?.on("open", function () {
      connection.on("data", function (data: any) {
        if (typeof data === "object") {
          setValues(data.values);

          if (player) {
            setTurn(player);
          }

          checkWinner();

          if (data.reset) {
            reset();
          }

          return;
        }

        toast.success(`${JSON.stringify(data)}`);
      });
    });
  }, [connection]);

  function reset() {
    setTurn("X");
    setValues(tiles);
    setWinner(null);
    setSolution([]);
  }

  function handleReset() {
    reset();
    connection?.send({ reset: true });
  }

  function checkWinner() {
    solutions.forEach((solution: any) => {
      if (
        values[solution[0]] &&
        values[solution[0]] === values[solution[1]] &&
        values[solution[0]] === values[solution[2]]
      ) {
        setSolution(solution);
        setWinner(values[solution[0]]);
      }
    });
  }

  return (
    <div className="h-full min-h-screen flex flex-col justify-center items-center">
      <Dialog
        className="fixed inset-0 z-100 flex justify-center items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        open={isQRCodeOpen}
        onClose={() => setIsQRCodeOpen(false)}
      >
        <Dialog.Panel className="bg-white p-4 flex flex-col justify-center items-center text-center">
          {peerID && (
            <>
              <QRCode value={peerID} />
              <p className="mt-4 text-sm text-gray-700">{peerID}</p>
            </>
          )}
        </Dialog.Panel>
      </Dialog>

      <Dialog
        className="fixed inset-0 z-100 flex justify-center items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        open={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      >
        <Dialog.Panel className="bg-white p-4 flex flex-col justify-center items-center text-center">
          <QRScanner
            isQRScannerOpen={isQRScannerOpen}
            setIsQRScannerOpen={setIsQRScannerOpen}
            connectionID={connectionID}
            setConnectionID={setConnectionID}
          />
        </Dialog.Panel>
      </Dialog>

      {!connection && (
        <div className="w-96 mb-4 flex justify-start items-start gap-4 flex-wrap">
          <button
            className="bg-gray-100 rounded-full px-4 py-2 font-semibold mt-8"
            onClick={() => setIsQRCodeOpen(true)}
          >
            Show QR code
          </button>
          <button
            className="bg-gray-100 rounded-full px-4 py-2 font-semibold mt-8"
            onClick={() => setIsQRScannerOpen(true)}
          >
            Scan QR code
          </button>
        </div>
      )}

      <div className="w-96 mb-8 grid grid-cols-3 gap-4">
        {connection && (
          <p className="flex flex-col justify-center items-center text-center bg-gray-50 p-6 rounded-lg">
            <span className="font-semibold text-sm text-gray-600">You Are</span>
            <span className="text-2xl font-semibold">{player}</span>
          </p>
        )}
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
        player={player}
        setWinner={setWinner}
        solution={solution}
        setSolution={setSolution}
        values={values}
        setValues={setValues}
        solutions={solutions}
        turn={turn}
        setTurn={setTurn}
        connection={connection}
        checkWinner={checkWinner}
      />

      <div className="flex justify-center">
        <button
          className="bg-gray-100 rounded-full px-4 py-2 font-semibold mt-8"
          onClick={handleReset}
        >
          Reset Board
        </button>
      </div>

      {connection && (
        <form
          className="w-96 mt-8 bg-gray-50 rounded-lg p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);

            connection?.send(formData.get("message"));

            e.currentTarget.reset();
          }}
        >
          <textarea
            placeholder="Message"
            name="message"
            className="border-2 border-gray-200 p-4 rounded-lg w-full"
          ></textarea>
          <button className="bg-green-600 text-white px-4 py-2 rounded-full font-bold mt-2">
            Send Message
          </button>
        </form>
      )}

      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
      />
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
  player,
  connection,
  checkWinner,
}: Board) => {
  const handleTileClick = (index: number) => {
    if (values[index] || winner || (connection && player != turn)) {
      return;
    }

    const newData = values;
    newData[index] = turn;

    setValues(newData);

    if (connection) {
      setTurn(player === "X" ? "O" : "X");
    } else {
      setTurn(turn === "X" ? "O" : "X");
    }

    connection?.send({ values: newData });

    checkWinner();
  };

  return (
    <div className="w-96 grid grid-cols-3 gap-4">
      {values.map((value, index) => {
        return (
          <button
            disabled={winner !== null || value !== null}
            className={`border-2 border-gray-200 h-24 rounded-lg font-semibold flex justify-center items-center text-xl disabled:text-gray-500 disabled:bg-gray-100 ${
              solution.includes(index) &&
              "!bg-green-100 !text-green-600 !border-green-200"
            } ${!winner && !value && turn === player && "!border-green-200"}`}
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

function QRScanner({ setIsQRScannerOpen, setConnectionID }: any) {
  useEffect(() => {
    let html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    html5QrcodeScanner.render(
      (decodedText, decodedResult) => {
        setConnectionID(decodedText);
        setIsQRScannerOpen(false);
      },
      (error) => {
        console.warn(`Code scan error = ${error}`);
      }
    );
  }, []);
  return (
    <div>
      <div id="reader" className="w-96"></div>
    </div>
  );
}
export default App;
