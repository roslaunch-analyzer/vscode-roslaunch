import { useEffect, useState } from 'react';
import { vscode } from "./utilities/vscode";
import SortableTree ,{TreeItem,TreeNode}from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import "./App.css";
import tmpJsonData from './tree.json';

interface ExtendedNodeData extends TreeItem {
  title: string;
  path?: string;
  children?: ExtendedNodeData[];
  expanded?: boolean;
}
interface CustomSearchMethodParams {
  node: ExtendedNodeData;
  searchQuery: string | undefined;
}

// Function implementation
const customSearchMethod = ({ node, searchQuery }: CustomSearchMethodParams): boolean =>
  !!searchQuery && node.title.toLowerCase().includes(searchQuery.toLowerCase());

function App() {
  const [treeData, setTreeData] = useState<ExtendedNodeData[]>([]);
  const [searchString, setSearchString] = useState<string>('');

  const parseTreeData = (jsonData: any): ExtendedNodeData[] => {
    const processNode = (node: any): ExtendedNodeData => ({
      title: node.name,
      path: node.parameters?.path || '',
      children: node.children ? node.children.map(processNode) : [],
      expanded: true, // Consider setting to false if tree is very large
    });

    return jsonData.map(processNode);
  };

  useEffect(() => {
    console.log('Loaded JSON Data:', tmpJsonData); // Check if data loads
    const initialData = parseTreeData([tmpJsonData]); // Ensure it's an array
    setTreeData(initialData);
  }, []);

  function handleNodeClick(nodeInfo: any) {
    const node = nodeInfo.node as ExtendedNodeData;
    if (node.path) {
      vscode.postMessage({
        command: "openFile",
        uri: node.path
      });
    }
  }
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
      <div className="tree-container"> {/* Updated class for scrolling */}
        <SortableTree
          treeData={treeData}
          onChange={setTreeData}
          generateNodeProps={(rowInfo) => ({
            onClick: () => handleNodeClick(rowInfo),
            title: (
              <span>
                {rowInfo.node.title}
              </span>
            )
          })}
          searchMethod={customSearchMethod}
          style={{marginLeft:3,fontWeight:"lighter",color:"red",fontSize:12}}
          searchQuery={searchString}
          searchFocusOffset={0}
        />
      </div>
    </main>
  );
}

export default App;
