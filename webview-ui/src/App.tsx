import { useEffect, useState, useRef } from 'react';
import SortableTree, { TreeNode ,TreeItem} from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import "./App.css";
import tmpJsonData from './tree.json';
import { vscode } from "./utilities/vscode";

interface ExtendedNodeData extends TreeItem {
  title: string;
  path?: string;
  children?: ExtendedNodeData[];
  parent?: ExtendedNodeData | null;
  expanded?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

function App() {
  const [treeData, setTreeData] = useState<ExtendedNodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<ExtendedNodeData | null>(null);
  const [searchString, setSearchString] = useState<string>('');

  const selectedNodeRef = useRef<HTMLSpanElement | null>(null);

  const parseTreeData = (jsonData: any, parent: ExtendedNodeData | null = null): ExtendedNodeData[] => {
    const processNode = (node: any, parentNode: ExtendedNodeData | null): ExtendedNodeData => {
      const newNode: ExtendedNodeData = {
        title: node.name,
        path: node.parameters?.path || '',
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
    const initialData = parseTreeData([tmpJsonData]); // Ensure it's an array
    setTreeData(initialData);
  }, []);

  const handleNodeClick = (nodeInfo: TreeNode<ExtendedNodeData>) => {
    const node = nodeInfo.node;
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
      if (selectedNodeRef.current) {
        selectedNodeRef.current.focus();
      }
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
    let currentNode: ExtendedNodeData | undefined| null = node;
    while (currentNode) {
      currentNode.expanded = true;
      currentNode = currentNode.parent;
    }
  };

  interface CustomSearchMethodParams {
    node: ExtendedNodeData;
    searchQuery: string | undefined;
  }
  
  // Function implementation
  const customSearchMethod = ({ node, searchQuery }: CustomSearchMethodParams): boolean =>
    !!searchQuery && node.title.toLowerCase().includes(searchQuery.toLowerCase());

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };
  
  return (
    <main>
      <h2>Ros2 Components</h2>
      <input
        type="text"
        placeholder="search.."
        value={searchString}
        onChange={handleSearchChange}
      />
      <div className="tree-container">
        <SortableTree
          treeData={treeData}
          onChange={setTreeData}
          generateNodeProps={(rowInfo) => ({
            onClick: (e: React.MouseEvent) => handleNodeClick(rowInfo),
            onContextMenu: (e: React.MouseEvent) => handleRightClick(e, rowInfo.node),
            title: (
              <span ref={rowInfo.node === selectedNode ? selectedNodeRef : null} tabIndex={-1}>
                {rowInfo.node.title}
              </span>
            ),
            style: {
              color: rowInfo.node.isSelected ? 'red' : 'grey',
              border: '1px solid gray',
              margin: '2px',
              borderRadius: '8px',
            }
          })}
          style={{ marginLeft: 3, fontSize: 12 }}
          canDrag={false}
          searchMethod={customSearchMethod}
          searchQuery={searchString}
          searchFocusOffset={0}
        />
      </div>
    </main>
  );
}

export default App;
