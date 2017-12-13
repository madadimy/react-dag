import React, { Component } from 'react';
import classnames from 'classname';

export default class Node extends Component {
  constructor(props) {
    super(props);
    this.changename = this.changename.bind(this)
    this.inputOnBlur = this.inputOnBlur.bind(this)
    this.inpueOnChange = this.inpueOnChange.bind(this)
    this.changeCname = this.changeCname.bind(this)
    const { style, type, label, id, name } = props;
    this.state = {
      style,
      type,
      label,
      id,
      name,
      changN: false,
    };
  }
  componentWillReceiveProps(newProps) {
    const { style, type, label, id,name } = newProps;
    this.setState({
      style,
      type,
      label,
      id,
      name,
    });
  }

  changename() {
    
    this.setState({ changN: true })
   
  }
  inputOnBlur() {

    this.props.changeName(this.state.id, this.state.name)
    this.setState({ changN: false })
  }
  inpueOnChange(e) {
    this.setState({ name: e.target.value })
  }
  changeCname() {
    let name = '';
    switch (this.state.label) {
      case 'APP': name = 'node-app';
        break;
      case '任务': name = 'node-task';
        break;
      case '事件': name = 'node-event';
        break;
      case '函数': name = 'node-func';
        break;
      case '变量': name = 'node-var';
        break;
      default: name = '';
    }
    return name;
  }
  render() {
    const classN = this.changeCname()
    return (
      <DAG-Node>
        <div className="box text-center"
          id={this.state.id}
          style={this.state.style}>
          <div className={classnames({ 'dag-node': true, [classN]: true, [this.state.type]: true })}>
            {(() => {
              switch (this.state.label) {
                case 'APP': return <span style={{ display: this.state.name ? 'none' : 'inline-block' }} className="ico-app"></span>;
                case '任务': return <span style={{ display: this.state.name ? 'none' : 'inline-block' }} className="ico-task"></span>;
                case '事件': return <span style={{ display: this.state.name ? 'none' : 'inline-block' }} className="ico-event"></span>;
                case '函数': return <span style={{ display: this.state.name ? 'none' : 'inline-block' }} className="ico-func"></span>;
                case '变量': return <span style={{ display: this.state.name ? 'none' : 'inline-block' }} className="ico-var"></span>;
              }
            })()}
            &nbsp;
            <span onDoubleClick={this.changename}
              style={{ display: this.state.changN ? 'none' : 'inline-block' }}
            >{this.state.name || this.state.label}</span>
            <input
              style={{ display: this.state.changN ? 'inline-block' : 'none', width: '42px' }}
              type="text"
              ref={(input) => {if(input != null){ input.focus();} }}
              autoFocus={true}
              maxLength={5}
             
              value={this.state.name}
              onBlur={this.inputOnBlur}
              onChange={this.inpueOnChange} />


          </div>
          {this.state.id === '000000000' || this.state.id === '99999999' || this.state.id === '111111111' || this.state.id === '888888888' ? ''
            : <div className='controllers'><div className="label" label={this.state.label}>编辑</div><div className="deleteLabel" label={this.state.label}>删除</div></div>}
        </div>
      </DAG-Node>
    )
  }
}
