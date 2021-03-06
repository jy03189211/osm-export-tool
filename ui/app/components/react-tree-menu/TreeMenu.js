import createClass from "create-react-class";
import invariant from "invariant";
import clone from "lodash/clone";
import map from "lodash/map";
import omit from "lodash/omit";
import sortBy from "lodash/sortBy";
import assign from "object-assign";
import PropTypes from "prop-types";
import React from "react";

import TreeNode from "./TreeNode";
import TreeNodeMixin from "./TreeNodeMixin";

const TreeNodeFactory = React.createFactory(TreeNode);

/**
 * The root component for a tree view. Can have one or many <TreeNode/> children
 *
 * @type {TreeMenu}
 */
var TreeMenu = createClass({
  mixins: [TreeNodeMixin],

  propTypes: {
    stateful: PropTypes.bool,
    classNamePrefix: PropTypes.string,
    identifier: PropTypes.string,
    onTreeNodeClick: PropTypes.func,
    onTreeNodeCheckChange: PropTypes.func,
    onTreeNodeSelectChange: PropTypes.func,
    collapsible: PropTypes.bool,
    expandIconClass: PropTypes.string,
    collapseIconClass: PropTypes.string,
    data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    labelFilter: PropTypes.func,
    onCheckboxHover: PropTypes.func,
    labelFactory: PropTypes.func,
    checkboxFactory: PropTypes.func,
    sort: PropTypes.oneOfType([PropTypes.bool, PropTypes.func])
  },

  getDefaultProps: function() {
    return {
      classNamePrefix: "tree-view",
      stateful: false
    };
  },

  render: function() {
    var props = this.props;

    return (
      <div className={props.classNamePrefix}>
        {this._getTreeNodes()}
      </div>
    );
  },

  /**
   * Gets data from declarative TreeMenu nodes
   *
   * @param children
   * @returns {*}
   * @private
   */
  _getDataFromChildren: function(children) {
    var iterableChildren = Array.isArray(children) ? children : [children];

    var self = this;
    return iterableChildren.map(function(child) {
      var data = clone(omit(child.props, "children"));

      if (child.props.children) {
        data.children = self._getDataFromChildren(child.props.children);
      }

      return data;
    });
  },

  /**
   * Get TreeNode instances for render()
   *
   * @returns {*}
   * @private
   */
  _getTreeNodes: function() {
    var treeMenuProps = this.props,
      treeData;

    invariant(
      !treeMenuProps.children || !treeMenuProps.data,
      "Either children or data props are expected in TreeMenu, but not both"
    );

    if (treeMenuProps.children) {
      treeData = this._getDataFromChildren(treeMenuProps.children);
    } else {
      treeData = treeMenuProps.data;
    }

    var thisComponent = this;

    function dataToNodes(data, ancestor) {
      var isRootNode = false;
      if (!ancestor) {
        isRootNode = true;
        ancestor = [];
      }

      var nodes = map(data, function(dataForNode, i) {
        var nodeProps = omit(dataForNode, [
            "children",
            "onClick",
            "onCheckChange"
          ]),
          children = [];

        nodeProps.label = nodeProps.label || i;

        if (dataForNode.children) {
          children = dataToNodes(
            dataForNode.children,
            ancestor.concat(
              thisComponent.getNodeId(treeMenuProps, nodeProps, i)
            )
          );
        }

        nodeProps = assign(
          nodeProps,
          thisComponent.getTreeNodeProps(
            treeMenuProps,
            nodeProps,
            ancestor,
            isRootNode,
            i
          )
        );

        return TreeNodeFactory(nodeProps, children);
      });

      var sort = thisComponent.props.sort;

      if (sort) {
        var sorter =
          typeof sort === "boolean"
            ? function(node) {
                return node.props.label;
              }
            : sort;
        nodes = sortBy(nodes, sorter);
      }

      return nodes;
    }

    if (treeData) {
      return dataToNodes(treeData);
    }
  }
});

export default TreeMenu;
