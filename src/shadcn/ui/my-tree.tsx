import { Tree, Checkbox, Divider } from "antd";
import { useState } from "react";

interface Permission {
  resourceType: string;
  permissionName: string;
  action: string; // "read,update,control"
  department: string;
}

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

  // 点击左侧节点
  const onSelect = (keys: any) => {
    if (keys.length > 0) {
      const key = keys[0];
      setSelectedKey(key);
      // 初始化右侧 checkbox 状态
      const actions = actionMap[key]?.split(",") || [];
      setCheckedActions((prev) => ({
        ...prev,
        [key]: actions,
      }));
    }
  };

  // 右侧 checkbox 改变
  const onActionChange = (action: string, checked: boolean) => {
    if (!selectedKey) return;
    setCheckedActions((prev) => {
      const current = prev[selectedKey] || [];
      let updated: string[];
      if (checked) {
        updated = Array.from(new Set([...current, action]));
      } else {
        updated = current.filter((a) => a !== action);
      }
      return {
        ...prev,
        [selectedKey]: updated,
      };
    });
  };

  // 获取右侧 action 对应的 checkbox
  const renderActions = () => {
    if (!selectedKey) return <div>请选择左侧权限节点</div>;
    const actions = ["read", "update", "control"];
    const checked = checkedActions[selectedKey] || [];
    return (
      <div>
        {actions.map((action) => (
          <Checkbox
            key={action}
            checked={checked.includes(action)}
            onChange={(e) => onActionChange(action, e.target.checked)}
          >
            {action}
          </Checkbox>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ width: 300 }}>
        <Tree
          treeData={treeData}
          onSelect={onSelect}
          defaultExpandAll
        />
      </div>
      <Divider type="vertical" />
      <div style={{ flex: 1 }}>
        <h4>权限操作</h4>
        {renderActions()}
      </div>
    </div>
  );
}
