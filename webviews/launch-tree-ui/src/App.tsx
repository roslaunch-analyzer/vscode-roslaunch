import { useEffect, useState, useRef } from 'react';
import SortableTree, { NodeData, TreeItem } from '@nosferatu500/react-sortable-tree';
import '@nosferatu500/react-sortable-tree/style.css';
import "./App.css";
import { vscode, getJsonData } from "./utilities/vscode";

interface ExtendedNodeData extends TreeItem {
  title: string;
  path?: string;
  type?: string;
  children?: ExtendedNodeData[];
  parent?: ExtendedNodeData | null;
  expanded?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

function App() {
  const [treeData, setTreeData] = useState<ExtendedNodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<ExtendedNodeData | null>(null);
  const [showNodes, setShowNodes] = useState(true);

  const selectedNodeRef = useRef<HTMLSpanElement | null>(null);

  const parseTreeData = (jsonData: any, parent: ExtendedNodeData | null = null): ExtendedNodeData[] => {
    const processNode = (node: any, parentNode: ExtendedNodeData | null): ExtendedNodeData => {
      const newNode: ExtendedNodeData = {
        title: node.title,
        path: node.path || '',
        type: node.type || "IncludeLaunchDescription",
        children: [],
        expanded: true,
        parent: parentNode,
        isSelected: false
      };
      newNode.children = node.children ? node.children.map((child: any) => processNode(child, newNode)) : [];
      return newNode;
    };

    return jsonData.map((node: any) => processNode(node, parent));
  };

  useEffect(() => {
    const tmpJsonData = getJsonData();
    const initialData = parseTreeData([tmpJsonData]); // Ensure it's an array
    setTreeData(initialData);
  }, []);

  useEffect(() => {
    const tmpJsonData = getJsonData();
    const initialData = parseTreeData([tmpJsonData]); // Ensure it's an array
    const filteredData = showNodes ? initialData : filterNodes(initialData);
    setTreeData(filteredData);
  }, [showNodes]);

  const filterNodes = (nodes: ExtendedNodeData[]): ExtendedNodeData[] => {
    return nodes
      .filter(node => node.type !== "Node")
      .map(node => ({
        ...node,
        children: node.children ? filterNodes(node.children) : []
      }));
  };

  const handleNodeClick = (nodeInfo: NodeData) => {
    const node = nodeInfo.node as ExtendedNodeData;
    const newData = [...treeData];
    if (selectedNode != null && selectedNode === node) {
      node.isSelected = false;
      resetTreeVisibility(newData, true);
      setSelectedNode(null);
    } else {
      resetTreeVisibility(newData, false);
      setSelectedNode(node);
      showNodeAndParents(node);
      node.isSelected = true;
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top of the page
    }
    setTreeData(newData);
  };

  const handleRightClick = (event: React.MouseEvent, node: ExtendedNodeData) => {
    event.preventDefault();
    if (node.path) {
      vscode.postMessage({
        command: "openFile",
        uri: node.path
      });
    }
  };

  const resetTreeVisibility = (nodes: ExtendedNodeData[], isVisible: boolean) => {
    nodes.forEach(node => {
      node.expanded = isVisible;
      if (node.children) {
        resetTreeVisibility(node.children, isVisible);
      }
    });
  };

  const showNodeAndParents = (node: ExtendedNodeData) => {
    let currentNode: ExtendedNodeData | undefined | null = node;
    while (currentNode) {
      currentNode.expanded = true;
      currentNode = currentNode.parent;
    }
  };

  return (
    <main>
      <h2>Ros2 Components</h2>
      {/* <label>
        <input
          type="checkbox"
          checked={showNodes}
          onChange={(e) => setShowNodes(e.target.checked)}
          disabled={selectedNode !== null}
        />
        Show Nodes
      </label> */}
      <div className="tree-container">
        <SortableTree
          treeData={treeData}
          onChange={setTreeData}
          generateNodeProps={(rowInfo) => ({
            onClick: (e: React.MouseEvent) => {
              if(e.ctrlKey){
                handleRightClick(e, rowInfo.node as ExtendedNodeData)
              
              }
              else if (!selectedNode || selectedNode === rowInfo.node) {
                handleNodeClick(rowInfo);
              }
            },
            onContextMenu: (e: React.MouseEvent) => handleRightClick(e, rowInfo.node as ExtendedNodeData),
            title: (
              <span ref={rowInfo.node === selectedNode ? selectedNodeRef : null} tabIndex={-1}>
                {rowInfo.node.title}
              </span>
            ),
            style: {
              color: (rowInfo.node as ExtendedNodeData).isSelected ? 'red' : 'grey',
              border: '1px solid grey',
              margin: '2px',
              borderRadius: '8px',
            },
            className: (rowInfo.node as ExtendedNodeData).type === 'Node' ? 'reddish-node' : 'grey-node',
            canDrag: false
          })}
          style={{ marginLeft: 3, fontSize: 12 }}
        />
      </div>
    </main>
  );
}

export default App;
