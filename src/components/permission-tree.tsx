import { useState } from "react";
import { Tree, Checkbox } from "antd";
import type { TreeProps, TreeDataNode } from "antd";

export interface PermissionResponse {
  data: TreeNode[]; // 树结构
  check: string[]; // 已选 key
  keyMap: Record<string, string>;
  tableMap: any | null;
  actionMap: Record<string, string[]>;
}

interface TreeNode {
  title: string;
  key: string;
  children: TreeNode[];
  item: any | null;
}


interface Props {
  treeData: TreeDataNode[];
  checkedKeys: string[];
  checkedActions: Record<string, string[]>;
  onChange: (value: {
    checkedKeys: string[];
    checkedActions: Record<string, string[]>;
  }) => void;
  checkable?: boolean;
  expand?: boolean;
}

const actionLabels: Record<string, string> = {
  read: "读取",
  update: "修改",
  control: "控制",
};

export function PermissionTree({
  treeData,
  checkable,
  checkedKeys,
  checkedActions,
  onChange,
  expand,
}: Props) {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const onInternalCheck: TreeProps["onCheck"] = (checkedKeysValue, info) => {
    const keys = Array.isArray(checkedKeysValue)
      ? checkedKeysValue
      : checkedKeysValue.checked;

    const newCheckedActions: Record<string, string[]> = { ...checkedActions };
    const actions = ["read", "update", "control"];

    // 收集节点及其所有子节点
    const collectKeys = (node: any): string[] => {
      let all: string[] = [node.key];
      if (node.children)
        node.children.forEach((child: any) => all.push(...collectKeys(child)));
      return all;
    };

    // 对 info.node 及其子节点进行处理
    const affectedKeys = collectKeys(info.node);

    if (keys.includes(info.node.key)) {
      // 勾选 > 父子节点权限全选
      affectedKeys.forEach((k) => {
        newCheckedActions[k] = actions;
      });
      setExpandedKeys((prev) =>
        Array.from(new Set([...prev, ...affectedKeys]))
      );

    } else {
      // 取消 > 删除父子节点权限，但权限面板保持展开
      affectedKeys.forEach((k) => {
        newCheckedActions[k] = [];
      });
    }

    onChange({
      checkedKeys: keys.map((key) => String(key)),
      checkedActions: newCheckedActions,
    });
  };

  const onInternalActionChange = (
    key: string,
    action: string,
    isChecked: boolean
  ) => {
    const currentActions = checkedActions[key] || [];
    const updatedActions = isChecked
      ? [...new Set([...currentActions, action])]
      : currentActions.filter((a) => a !== action);

    const newCheckedKeys = [...checkedKeys];
    if (updatedActions.length > 0 && !newCheckedKeys.includes(key)) {
      newCheckedKeys.push(key);
    } else if (updatedActions.length === 0) {
      const index = newCheckedKeys.indexOf(key);
      if (index > -1) newCheckedKeys.splice(index, 1);
    }

    onChange({
      checkedKeys: newCheckedKeys,
      checkedActions: {
        ...checkedActions,
        [key]: updatedActions,
      },
    });
  };

  const renderTreeData = (nodes: TreeDataNode[]): TreeDataNode[] =>
    nodes.map((node) => {
      const actions = ["read", "update", "control"];
      const checked = checkedActions[node.key as string] || [];

      return {
        ...node,
        title: (
          <div className="flex items-center gap-3">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setExpandedKeys((prev) =>
                  prev.includes(node.key)
                    ? prev.filter((k) => k !== node.key)
                    : [...prev, node.key]
                );
              }}
              className="cursor-pointer"
            >
              {typeof node.title === "function"
                ? node.title({} as TreeDataNode)
                : node.title}
            </span>

            {expandedKeys.includes(node.key as string) && (
              <div className="flex items-center gap-2">
                {actions.map((action) => (
                  <Checkbox
                    key={action}
                    checked={checked.includes(action)}
                    onChange={(e) =>
                      onInternalActionChange(
                        node.key as string,
                        action,
                        e.target.checked
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actionLabels[action]}
                  </Checkbox>
                ))}
              </div>
            )}
          </div>
        ),
        children: node.children ? renderTreeData(node.children) : undefined,
      };
    });

  return (
    <Tree
      checkable={checkable}
      checkedKeys={checkedKeys}
      treeData={renderTreeData(treeData)}
      onCheck={onInternalCheck}
      defaultExpandAll={expand}
    />
  );
}
