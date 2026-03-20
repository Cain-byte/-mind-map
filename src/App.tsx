import { useState, useRef, useCallback } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import "./App.css";

interface Node {
  id: number;
  text: string;
  x: number;
  y: number;
}

export default function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [input, setInput] = useState("");
  const nextId = useRef(0);

  const saveBoard = async () => {
    const path = await save({
      filters: [{ name: "Mapa de Etapas", extensions: ["json"] }],
      defaultPath: "meu-mapa.json",
    });
    if (!path) return;
    await writeTextFile(path, JSON.stringify(nodes));
  };

  const openBoard = async () => {
    const path = await open({
      filters: [{ name: "Mapa de Etapas", extensions: ["json"] }],
      multiple: false,
    });
    if (!path) return;
    const content = await readTextFile(path as string);
    const saved: Node[] = JSON.parse(content);
    setNodes(saved);
    const maxId = saved.reduce((max, n) => Math.max(max, n.id), -1);
    nextId.current = maxId + 1;
  };

  const addNode = () => {
    if (!input.trim()) return;
    setNodes((prev) => [
      ...prev,
      { id: nextId.current++, text: input, x: 100, y: 100 },
    ]);
    setInput("");
  };

  const deleteNode = (id: number) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const makeDraggable = useCallback((id: number) => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).tagName === "BUTTON") return;
      const el = e.currentTarget;
      const offsetX = e.clientX - el.offsetLeft;
      const offsetY = e.clientY - el.offsetTop;

      const onMove = (ev: MouseEvent) => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, x: ev.clientX - offsetX, y: ev.clientY - offsetY }
              : n
          )
        );
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      <div className="topbar">
        <input
          type="text"
          placeholder="Nova etapa..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNode()}
        />
        <button onClick={addNode}>Adicionar</button>
        <button onClick={saveBoard}>Salvar</button>
        <button onClick={openBoard}>Abrir</button>
      </div>

      <div id="canvas">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="node"
            style={{ left: node.x, top: node.y }}
            onMouseDown={makeDraggable(node.id)}
          >
            <span>{node.text}</span>
            <button
              className="delete-btn"
              onClick={() => deleteNode(node.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}