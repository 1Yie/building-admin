import { Tree, Checkbox } from "antd";
import type { TreeProps } from "antd";
import { useState } from "react";

interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
}

interface ActionMap {
  [key: string]: string; // key -> "read,update,control"
}

interface Props {
  treeData: TreeNode[];
  actionMap: ActionMap;
}

export function MyTree({ treeData, actionMap }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [checkedActions, setCheckedActions] = useState<Record<string, string[]>>({});

  // Tree 节点选择
  const onSelect: TreeProps['onSelect'] = (keys) => {
    if (keys.length > 0) {
      const key = keys[0] as string;
      setSelectedKey(key);

      // 初始化权限状态，如果之前有保存则使用已选，否则从 actionMap 获取
      const actions = actionMap?.[key]?.split(",") || [];
      setCheckedActions((prev) => ({
        ...prev,
        [key]: prev[key] || actions,
      }));
    }
  };

  // 点击权限 Checkbox
  const onActionChange = (key: string, action: string, checked: boolean) => {
    setCheckedActions((prev) => {
      const current = prev[key] || [];
      const updated = checked
        ? Array.from(new Set([...current, action]))
        : current.filter((a) => a !== action);
      return {
        ...prev,
        [key]: updated,
      };
    });
  };

  // 渲染带 Checkbox 的 TreeData
  const renderTreeData = (nodes: TreeNode[]): any =>
    nodes.map((node) => {
      const actions = ["read", "update", "control"];
      const checked = checkedActions[node.key] || [];

      return {
        ...node,
        title: (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>{node.title}</span>
            {selectedKey === node.key &&
              actions.map((action) => (
                <Checkbox
                  key={action}
                  checked={checked.includes(action)}
                  onChange={(e) => onActionChange(node.key, action, e.target.checked)}
                  onClick={(e) => e.stopPropagation()} // 阻止冒泡，不取消选中
                >
                  {action}
                </Checkbox>
              ))}
          </div>
        ),
        children: node.children ? renderTreeData(node.children) : undefined,
      };
    });

  return (
    <div>
      <Tree
        treeData={renderTreeData(treeData)}
        onSelect={onSelect}
        defaultExpandAll={false}
      />
    </div>
  );
}
