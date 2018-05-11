import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { configureStore } from './dag-store';
import { getSettings } from './dag-settings';
import uuid from 'uuid/v4';
import NodesList from './components/NodesList/NodesList'
require('./styles/dag.less');
var jsPlumb = require('jsplumb');
var classnames = require('classname');
let dragStart = '';
let dragEnd = '';
let num = 0;
export class DAG extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.changeName = this.changeName.bind(this);
    this.changeLine = this.changeLine.bind(this);
    this.openLine = this.openLine.bind(this);
    this.openNode = this.openNode.bind(this);
    this.renderGraph = this.renderGraph.bind(this);
    let { data, additionalReducersMap, enhancers = [], middlewares = [] } = props;
    this.store = configureStore(
      data,
      additionalReducersMap,
      [...middlewares],
      [...enhancers]
    );

    this.state = Object.assign({}, this.store.getState(), { show: true });
    if (props.data) {
      this.toggleLoading(true);
    }
    this.endpoints = [];
    if (props.settings) {
      this.settings = Object.assign({}, props.settings);
    } else {
      this.settings = getSettings();
    }
    this.store.subscribe(() => {
      
      if (this.state.graph.translate == this.store.getState().graph.translate) {
          //  console.log('允许更新')
           this.setState(this.store.getState());
      } else {
        console.log('阻止更新')
         this.setState(this.store.getState());
        return
      }
    
     
      setTimeout(this.renderGraph.bind(this));
    });

    jsPlumb.ready(() => {
      let that = this 
      let dagSettings = this.settings.default;
      let container = document.querySelector(`${this.state.componentId} #dag-container`);
      jsPlumb.setContainer(container);
      this.instance = jsPlumb.getInstance(dagSettings);
      this.instance.bind('connection', this.makeConnections.bind(this));
      this.instance.bind('connectionDetached', this.makeConnections.bind(this));
      this.instance.bind('click', function (e) {
        that.openLine(e, 'open')

      })
      this.instance.bind('dblclick', function (e) {
       
        that.openLine(e, 'del')
      })
      this.instance.bind('mouseover', function (e) {
        e.setType("bar")
      })
      this.instance.bind('mouseout', function (e) {
        e.setType("foo")
      })
      this.instance.registerConnectionTypes({
        "foo": { paintStyle: { stroke: '#2da5e2', strokeWidth: 2, radius: 5, lineWidth: 2 } },
        "bar": { paintStyle: { stroke: '#156086', strokeWidth: 2, radius: 5, lineWidth: 2 } },

      });
    });
  }
  toggleLoading(loading) {
    this.store.dispatch({
      type: 'LOADING',
      payload: {
        loading: loading
      }
    });
  }
  renderGraph() {
    // console.log('绘制dag')
    this.addEndpoints();
    this.makeNodesDraggable();
    this.renderConnections();
  }

  makeNodesDraggable() {
    let nodes = document.querySelectorAll('#dag-container .box');
    this.instance.draggable(nodes, {
      start: (nodes) => {
        // this.setState({show:false })
        dragStart = new Date().getTime()
        // console.log('Starting to drag')

      },
      stop: (dragEndEvent) => {
        dragEnd = new Date().getTime()
        //  console.log('End to drag')
        //  console.log(dragEndEvent.el.style.top,dragEndEvent.el.style.left)

        this.store.dispatch({
          type: 'UPDATE_NODE',
          payload: {
            nodeId: dragEndEvent.el.id,
            style: {
              top: Math.round(parseInt(dragEndEvent.el.style.top) / 40) * 40 + 'px',
              left: Math.round(parseInt(dragEndEvent.el.style.left) / 80) * 80 + 'px',
            }
          }
        });
        this.instance.repaintEverything();


      }
    });
  }
  makeConnections(info, originalEvent) {
    

    if (!originalEvent) { return; }
    // console.log('make', info, originalEvent)
    // console.log('make', info.sourceEndpoint.anchor)
    //静态兼容
    let isstatic = this.props.settings.transformSource.anchors.length > 3 ? true:false;
    //画线去重
    let allstate = this.store.getState().connections;
   // console.log('store', allstate)
    for (let i = 0; i < allstate.length; i++) {
      if (allstate[i].from == info.sourceId && allstate[i].to == info.targetId) {
        //发现重复不再绘制
        let connections = allstate
       // 更新state 退出函数
        this.store.dispatch({
          type: 'SET-CONNECTIONS',
          payload: {
            connections
          }
        });
        return
      }
    }

    let connections = this.instance
      .getConnections()
      .map((conn) => {
         let formpoint ;
          let topoint ;
        if (isstatic) {
           formpoint = [{ type: 'Right' }];
           topoint = [{ type: 'Left' }];
        } else {
           formpoint = conn.endpoints[0].anchor.anchors.filter((point) => {
          if (conn.endpoints[0].anchor.x === point.x) {
            return true
          } else {
            return false
          }

        })
         topoint = conn.endpoints[1].anchor.anchors.filter((point) => {
          if (conn.endpoints[1].anchor.x === point.x) {
            return true
          } else {
            return false
          }

        })
        }
       
        // console.log(formpoint[0].type, topoint[0].type)
        return {
          out: formpoint[0].type,
          in: topoint[0].type,
          from: conn.sourceId,
          to: conn.targetId,
          label: conn.getOverlay("myLabel") ? conn.getOverlay("myLabel").getLabel() : '',
        }
      });
    // console.log('makeline', this.instance.getConnections()[0].endpoints[0].anchor)

    //send ajax when onConnect getEndpoint
    //this.saveChange(this, connections);

    this.store.dispatch({
      type: 'SET-CONNECTIONS',
      payload: {
        connections
      }
    });
    //changline
    if (info.connection.suspendedElementId) {
      let line = {
        oldTargetId: info.connection.suspendedElementId,
        sourceId: info.sourceId,
        targetId: info.targetId,

      }
      this.changeLine(this, line)
    }
  }
  changeLine(obj, line) {
    if (typeof obj.props.changeLine === 'function') {
      obj.props.changeLine(line);
    }
  }
  saveChange(obj, connections) {

    if (typeof obj.props.handleChange === "function") {
      //	let json = {};
      //	json.id = info.sourceId + '-' + info.targetId;
      //	json.start_block_id = info.sourceId;
      //	json.end_block_id = info.targetId;
      //	json.conditions = '[]';
      //	this.props.onConnect(json);
      //console.dir(this.props.data);
      let data = obj.props.data;
      data.nodes = obj.store.getState().nodes;
      data.connections = connections;
      data.graph = this.state.graph;
      obj.props.handleChange(data);

    }
  }
  renderConnections() {
    
   // console.log('settings', this.props.settings.transformSource.anchors.length);
   
    let that = this;
    let connectionsFromInstance = this.instance
      .getConnections()
      .map(conn => ({
        from: conn.sourceId,
        to: conn.targetId
      })
      );
    let { nodes, connections } = this.store.getState();
    // console.log('line', connections)
    // console.log('node', nodes)
    if (connections.length === connectionsFromInstance.length) {
      //not connections  save node
      if (connections.length == 0) {
       
        this.saveChange(this, []);
      }
      return;
    }

    connections
      .forEach(connection => {
        var sourceNode = nodes.find(node => node.id === connection.from);
        var targetNode = nodes.find(node => node.id === connection.to);
        var label = connection.label ? connection.label : '';
        if (sourceNode && targetNode) {
          if (connection.out) {
            var sourceId = sourceNode.type === 'transform' ? connection.out + connection.from : 'out' + connection.from;
          var targetId = targetNode.type === 'transform' ? connection.in + connection.to : 'in' + connection.to;
          } else {
            console.log('old line')  
            var sourceId = sourceNode.type === 'transform' ? 'Right' + connection.from : 'out' + connection.from;
          var targetId = targetNode.type === 'transform' ? 'Left' + connection.to : 'in' + connection.to;
          }
          
          var connObj = {
            uuids: [sourceId, targetId],
            detachable: true,
            overlays: [["Label", { label: label, location: 0.65, class: 'myLabel', id: 'myLabel' }]],
            hoverPaintStyle: { strokeStyle: "red" },
            paintStyle: { stroke: "blue", strokeWidth: 10 },
            type: "foo",
          };
          this.instance.connect(connObj);


        }
      });
   
    //
    //静态兼容
    let isstatic = this.props.settings.transformSource.anchors.length > 3 ? true:false;
   
    connectionsFromInstance = this.instance
      .getConnections()
      .map((conn) => {
         let formpoint ;
          let topoint ;
         if (isstatic) {
           formpoint = [{ type: 'Right' }];
           topoint = [{ type: 'Left' }];
         } else {
          formpoint = conn.endpoints[0].anchor.anchors.filter((point) => {
          if (conn.endpoints[0].anchor.x === point.x) {
            return true
          } else {
            return false
          }

        })
        topoint = conn.endpoints[1].anchor.anchors.filter((point) => {
          if (conn.endpoints[1].anchor.x === point.x) {
            return true
          } else {
            return false
          }

        })
        }

        

        return {
          out: formpoint[0].type,
          in: topoint[0].type,
          from: conn.sourceId,
          to: conn.targetId,
          label: conn.getOverlay("myLabel") ? conn.getOverlay("myLabel").getLabel() : '',
        }
      })
    //首次加载页面不保存数据
   
    num++;
     if (num>2){
         this.saveChange(this, connectionsFromInstance);
    }
 
   
    
  }
  addEndpoints() {
    let nodes = this.store.getState().nodes;
    let nodesId = nodes.map(node => node.id);
    this.endpoints = this.endpoints.filter(endpoint => {
      return nodesId.indexOf(endpoint) !== -1
    });
    //Don't delete endpoints when dragged
    if (window.isNodeDrag) {
      window.isNodeDrag = false;
    } else {
      this.instance.deleteEveryEndpoint();
    }
    this.instance.detachEveryConnection();

    nodes.forEach(node => {
      let type = node.type;
      switch (type) {
        case 'source':
          this.instance.addEndpoint(node.id, this.settings.source, { uuid: 'out' + node.id });
          return;
        case 'sink':
          this.instance.addEndpoint(node.id, this.settings.sink, { uuid: 'in' + node.id });
          return;
        default:
          this.instance.addEndpoint(node.id, this.settings.transformSource, { uuid: `Bottom${node.id}` ,});
          this.instance.addEndpoint(node.id, this.settings.transformSource, { uuid: `Right${node.id}`, });
          this.instance.addEndpoint(node.id, this.settings.transformSink, { uuid: `Top${node.id}`, });
          this.instance.addEndpoint(node.id, this.settings.transformSink, { uuid: `Left${node.id}`, });
      }
    });
  }
  componentDidMount() {
    this.setState(this.store.getState());
    // Because html id needs to start with a character
    this.setState({ componentId: 'A' + uuid() });
    setTimeout(() => {
      this.toggleLoading(false);
      if (Object.keys(this.props.data || {}).length) {
      // console.log('DidMount后加载数据')  
        this.renderGraph();
        // this.cleanUpGraph();
      }
    }, 600);


  }
  

  addNode(node) {
    let { type, label, style, name } = node;
    this.store.dispatch({
      type: 'ADD-NODE',
      payload: {
        type,
        label,
        style: {
          top: Math.round(parseInt(style.top) / 40) * 40 + 'px',
          left: Math.round(parseInt(style.left) / 80) * 80 + 'px',
        },
        name: name,
        id: type + Date.now().toString().slice(8)
      }
    });
  }
  removeConnection(sourceid, targetid) {

    this.store.dispatch({
      type: 'REMOVE-CONNECTION',
      payload: {
        from: sourceid,
        to: targetid
      }
    });
  }
  addConnectionLable(sourceid, targetid, label) {

    this.store.dispatch({
      type: 'SET-LABLE',
      payload: {
        from: sourceid,
        to: targetid,
        label: label,
      }
    });
  }
  removeNode(nodeId) {
    this.store.dispatch({
      type: 'REMOVE-NODE',
      payload: {
        id: nodeId
      }
    });
  }
  changeName(nodeId, newName) {
    this.store.dispatch({
      type: 'UPDATE_NAME',
      payload: {
        id: nodeId,
        name: newName,
      }
    });
  }
  cleanUpGraph() {
    let { nodes, connections } = this.store.getState();
    this.store.dispatch({
      type: 'CLEANUP-GRAPH',
      payload: { nodes, connections }
    });

    this.store.dispatch({
      type: 'FIT-TO-SCREEN',
      payload: {
        nodes,
        connections,
        parentSelector: `#${this.state.componentId} .diagram-container`
      }
    });
    setTimeout(this.instance.repaintEverything.bind(this));
  }
  componentWillUnmount() {
    this.store.dispatch({
      type: 'RESET'
    });
  }
  openNode(e, id, label, type) {
    //  console.log(dragEnd-dragStart)
    if (id == '000000000' || id == '99999999' || id == '111111111' || id == '888888888') {
      return
    } else {
      try {
        if (dragEnd - dragStart < 150) {
          dragEnd = '';
          dragStart = '';
          this.props.openmodes(e, id, label, type)
        } else {
          dragEnd = '';
          dragStart = '';
          // this.setState({show:true}) 
        }

      } catch (e) {
        console.log(e)
        console.log(this.state)
        return;
      }


    }

  }
  openLine(e, type) {
    this.props.openlines(e, type)

  }

  render() {
    const loadContent = () => {
      if (this.state.graph.loading) {
        return (
          <div className="fa fa-spin fa-refresh fa-5x"></div>
        );
      }
    };
    const loadNodes = () => {
      if (!this.state.graph.loading) {
        return (
          <NodesList nodes={this.state.nodes} changeName={this.changeName} openNode={this.openNode} />
        );
      }
    };
    const getStyles = () => {
      let style = {
        transform: ''
      };
      if (this.state.graph.scale) {
        style.transform += `scale(${this.state.graph.scale})`;
        this.instance.setZoom(this.state.graph.scale);
      }
      if (this.state.graph.translate) {
        style.transform += `translate(${this.state.graph.translate})`;
      }
      return style;
    };
    return (
      <my-dag id={this.state.componentId}>
        {this.props.children}
        <div className="diagram-container">
          <div id="dag-container" style={getStyles()} 

          >
            {loadContent()}
            {loadNodes()}
            </div>
        </div>
      </my-dag>
    );
  }
}
