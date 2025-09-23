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

export interface TreeNode {
  title: string;
  key: string;
  children: TreeNode[] | undefined;
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

  // 检查节点是否是传感器 (通过key判断是否是building-CGQ开头)
  const isSensor = (node: { key: string } | TreeNode | TreeDataNode) => {
    return String(node.key).startsWith("building-CGQ");
  };

  const onInternalCheck: TreeProps["onCheck"] = (checkedKeysValue, info) => {
    const keys = Array.isArray(checkedKeysValue)
      ? checkedKeysValue
      : checkedKeysValue.checked;

    const newCheckedActions: Record<string, string[]> = { ...checkedActions };
    const actions = ["read", "update", "control"];

    const collectKeys = (node: any): string[] => {
      let all: string[] = [node.key];
      if (node.children)
        node.children.forEach((child: any) => all.push(...collectKeys(child)));
      return all;
    };

    const affectedKeys = collectKeys(info.node);
    let newCheckedKeys = [...keys];

    if (keys.includes(info.node.key)) {
      // 勾选 > 父子节点权限全选
      affectedKeys.forEach((k) => {
        // 只有传感器节点才赋予 control 权限
        newCheckedActions[k] = isSensor({
          key: k,
          title: "",
          children: [],
          item: null,
        })
          ? actions
          : ["read", "update"]; // 非传感器只给 read+update

        // 确保所有受影响的子节点都被添加到 checkedKeys 中
        if (!newCheckedKeys.includes(k)) {
          newCheckedKeys.push(k);
        }
      });

      setExpandedKeys((prev) =>
        Array.from(new Set([...prev, ...affectedKeys]))
      );
    } else {
      // 取消 > 删除父子节点权限
      affectedKeys.forEach((k) => {
        newCheckedActions[k] = [];
        // 从 checkedKeys 中移除所有受影响的子节点
        newCheckedKeys = newCheckedKeys.filter((key) => key !== k);
      });
    }

    onChange({
      checkedKeys: newCheckedKeys.map((key) => String(key)),
      checkedActions: newCheckedActions,
    });
  };

  const onInternalActionChange = (
    key: string,
    action: string,
    isChecked: boolean
  ) => {
    // 仅当节点为传感器时，才允许更改控制权限
    if (
      action === "control" &&
      !isSensor({ key, title: "", children: [], item: null })
    ) {
      return; // 如果不是传感器，不允许更改 control 权限
    }

    // 递归收集所有子节点的key
    const collectChildKeys = (
      nodes: TreeDataNode[],
      parentKey: string
    ): string[] => {
      let childKeys: string[] = [];
      for (const node of nodes) {
        if (node.key === parentKey && node.children) {
          for (const child of node.children) {
            childKeys.push(child.key as string);
            childKeys.push(...collectChildKeys(nodes, child.key as string));
          }
        } else if (node.children) {
          childKeys.push(...collectChildKeys(node.children, parentKey));
        }
      }
      return childKeys;
    };

    const childKeys = collectChildKeys(treeData, key);
    const allAffectedKeys = [key, ...childKeys];

    const newCheckedActions = { ...checkedActions };
    const newCheckedKeys = [...checkedKeys];

    allAffectedKeys.forEach((affectedKey) => {
      const currentActions = newCheckedActions[affectedKey] || [];

      if (isChecked) {
        // 添加权限
        const updatedActions = [...new Set([...currentActions, action])];
        newCheckedActions[affectedKey] = updatedActions;

        // 确保节点被选中
        if (!newCheckedKeys.includes(affectedKey)) {
          newCheckedKeys.push(affectedKey);
        }
      } else {
        // 移除权限
        const updatedActions = currentActions.filter((a) => a !== action);
        newCheckedActions[affectedKey] = updatedActions;

        // 如果没有任何权限，从选中列表中移除
        if (updatedActions.length === 0) {
          const index = newCheckedKeys.indexOf(affectedKey);
          if (index > -1) newCheckedKeys.splice(index, 1);
        }
      }
    });

    onChange({
      checkedKeys: newCheckedKeys,
      checkedActions: newCheckedActions,
    });
  };

  const renderTreeData = (nodes: TreeDataNode[]): TreeDataNode[] =>
    nodes.map((node) => {
      const actions = ["read", "update", "control"];
      const checked = checkedActions[node.key as string] || [];

      // 根据是否是传感器，动态决定是否渲染 control 权限
      const actionToRender = isSensor(node)
        ? actions // 如果是传感器，渲染所有动作
        : actions.filter((action) => action !== "control"); // 非传感器，只渲染 read 和 update

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
                {actionToRender.map((action) => (
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
