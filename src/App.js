import React from 'react';
import './App.css';
import ClipboardJS from 'clipboard'
import classnames from 'classnames'
import Sortable from 'sortablejs';
import axios from 'axios'
import dayjs from 'dayjs'
class App extends React.Component{
  constructor() {
    super()
    this.state = {
      fundData: JSON.parse(localStorage.getItem('fund')) || [],
      showList: [],
      today: 0,
      all: 0,
      addItem: {},
      inputJson: '',
      timeCut: 120,
      isEditor: false,
      totalUpdateNum: 0,
      boardData: []
    }
  }
  componentDidMount() {
    this.getBoardIndex()
    console.log(this.state.fundData)
    new ClipboardJS('#saveJSON')
    this.getFundDatas()
    const el = document.getElementById('list');
    const sortable = new Sortable(el, {
      handle: '.handle',
      animation: 150,
      dragClass: 'selected',
      ghostClass:'ghost'
    })
    this.setState({
      sortable
    })
    this.getNewFundData()
  }
  /**
   * 精确四舍五入
   */
  round = (num)=>{
    return Math.round((+num + Number.EPSILON) * 100) / 100
  }
  /**
   * https://api.doctorxiong.club/v1/stock/board
   * 大盘指数
   */
  getBoardIndex() {
    axios.get('https://api.doctorxiong.club/v1/stock/board').then(res => {
      console.log(res)
      this.setState({
        boardData:res.data.data
      })
    }).catch(err => {
      console.log(err)
    })
  }

  /**
   * 获取今日收益
   */
  getNewFundData() {
    let arr = []
    this.state.fundData.forEach((item, index) => {
      arr.push(item.id) 
    })
    const code = arr.toString()
    axios.get(`https://api.doctorxiong.club/v1/fund?code=${code}`).then(res => {
      const showList = this.state.showList
      let {totalUpdateNum} = this.state
      const timeNow = dayjs().format('YYYY-MM-DD')
      showList.forEach((item) => {
        const fundItem = res.data.data.find((item2) => item2.code === item.fundcode)
        if (fundItem.netWorthDate === timeNow) {
          item.dayGrowth = +fundItem.dayGrowth
          item.netWorth = +fundItem.netWorth
          item.isUpdate = true
          item.gztime = dayjs().format('YYYY-MM-DD HH:mm')
          totalUpdateNum++
        } else {
          item.dayGrowth = null
        }
      })
      this.setState({
        showList,
        totalUpdateNum
      })
    }).catch(err => {
      console.log(err)
    })

  }
  getFundDatas(reload = false) {
    this.setState({
      showList:[]
    })
    this.state.fundData.forEach(item => {
      this.jsonp(`https://fundgz.1234567.com.cn/js/${item.id}.js?rt=${new Date().getTime()}`)
    })
    // this.timeCut(reload)
  }
  jsonp(url, jsonpCallback = 'jsonpgz') {
    const script = document.createElement('script')
    script.src = url
    script.onload = (e)=> {
      e.currentTarget.remove()
    }
    window[jsonpCallback] = data => {
      if(!data) {return}
      const { showList, fundData } = this.state
      const config = fundData.find((item) => item.id === data.fundcode)
      if (!config) {
        fundData.push({
          id: data.fundcode,
          num: 0,
          money:0
        })
      }
      showList.push(data)
      this.setState({
        showList,
        fundData
      })
    }
    document.body.appendChild(script)
  }
  ondelete(code) {
    const result = window.confirm("是否要删除该基金")
    if (result) {
      const { fundData,showList } = this.state
      const newList = fundData.filter(item => item.id !== code)
      let _showList = showList.filter(item=>item.fundcode!==code)
      this.setState({
        fundData: newList,
        showList:_showList
      }, () => {
        this.saveToLocalStorage()
      })
    }
  }
  onAdd() {
    const { fundData, addItem } = this.state
    if (addItem.id) {
      fundData.push(addItem)
    }
    this.setState({
      fundData,
      addItem: {}
    }, () => {
      this.getFundDatas()
      this.saveToLocalStorage()
    })
  }
  changeAddItem(e, type) {
    const { addItem } = this.state 
    addItem[type] = e.target.value
    this.setState({
      addItem
    })
  }
  /**
   * 保存到localStorage
   */
  saveToLocalStorage(data) {
    const { fundData } = this.state
    const json = JSON.stringify(fundData)
    localStorage.setItem('fund',data||json)
  }
  changeDate(e,code,type) {
    let { fundData } = this.state
    const value = fundData.find((item => item.id === code))
    if (type ==='num') {
      value.num = e.target.value
    } else {
      value.money = e.target.value
    }
    this.setState({
      fundData
    })
    const data = JSON.stringify(fundData)
    this.saveToLocalStorage(data)
  }
  /**
   * 导入json
   */
  importJson() {
    const { inputJson } = this.state
    if (!inputJson) {
      return
    }
    const jsonData = JSON.parse(JSON.parse(inputJson))
    this.setState({
      fundData:jsonData
    }, () => {
      this.getFundDatas(true)
      this.saveToLocalStorage()
    })
  }
  /**
   * 倒计时
   * @param {*} reload | 是否重置倒计时
   */
  timeCut(reload = false) {
    if (reload) {
      this.setState({
        timeCut:120
      })
      return
    }
    let { timeCut } = this.state
    this.setState({
      timeCut:timeCut-1
    })
    if (timeCut > 1) {
      setTimeout(() => {
        this.timeCut()
      },1000)
    } else {
      this.setState({
        timeCut:120
      })
      this.getFundDatas()
    }
  }
 /**
  * 编辑模式
  * @param {Boolean} isEnterEditor | 是否进入编辑模式
  */
  editor(isEditor) {
    this.setState({
      isEditor:isEditor||!this.state.isEditor
    })
  }
  render() {
    const { round } = this
    const { showList, fundData,addItem,inputJson,timeCut,isEditor,totalUpdateNum } = this.state
    let _today = 0
    let _all = 0
    let _allMoney = 0
    let showList_sort = showList.sort((a,b) => {
      return Number(b.fundcode) - Number(a.fundcode)
    })
    const boardList = this.state.boardData.map((item, index) => {
      return (
        <div className={classnames('board',item.changePercent<0?'green':'red')}>
          <div className="boardName">{item.name}</div>
          <div className="price">{item.price}</div>
          <div className="change">
            <span>{item.priceChange}</span>
            <span>{item.changePercent}%</span>
          </div>
        </div>
      )
    })
    const _showList = showList_sort.map((item) => {
      const isRed = item.dwjz <= item.gsz ? 'red' : 'green'
      const own = fundData.find((item2) => item2.id === item.fundcode) || { num: 0, money: 0 }
      const today = round(item.dwjz * own.num * (item.dayGrowth?item.dayGrowth:item.gszzl) / 100)
      const all = round((item.netWorth?item.netWorth:item.gsz) * own.num - own.money)
        // (item.gsz * own.num - own.money).toFixed(2)
      _today += Number(today)
      _all += Number(all)
      _allMoney += Number(own.money)
      return (
        <tr key={item.fundcode}>
          <td className='handle'>☰</td>
          <td>{item.name}</td>
          <td>{item.fundcode}</td>
          <td>{item.dwjz}</td>
          <td className={isRed}>{item.gsz}</td>
          <td className={isRed}>{item.gszzl}%</td>
          <td className={isRed}>{item.dayGrowth?`${this.round(item.dayGrowth)}%`:'-'}</td>
          <td>
            {isEditor ?
              <input type="text" placeholder='持仓份额' value={own.num} onChange={(e) => this.changeDate(e, item.fundcode, 'num')} />
            :own.num
            }
          </td>
          <td>
            {isEditor?
              <input type="text" placeholder='投入金额' value={own.money} onChange={(e) => this.changeDate(e, item.fundcode, 'money')} />
            :own.money
            }
          </td>
          <td className={classnames(today>0?'red':'green',item.isUpdate&&'update')}>￥{today}</td>
          <td className={classnames(all>0?'red':'green',item.isUpdate&&'update')}>￥{all}</td>
          <td className={classnames(item.isUpdate&&'time update')}>{item.gztime}</td>
          <td onClick={()=>this.ondelete(item.fundcode)}>删除</td>
        </tr>
      )
    })
    return(
      <div className="App">
        <div className='add'>
          <input type="text" placeholder='基金代码' value={addItem.id||''} onChange={e=>this.changeAddItem(e,'id')}/>
          <input type="text" placeholder='持仓份额' value={addItem.num||''} onChange={e=>this.changeAddItem(e,'num')}/>
          <input type="text" placeholder='总投入' value={addItem.money||''} onChange={e=>this.changeAddItem(e,'money')}/>
          <div className='btn blue' onClick={()=>this.onAdd()}>新增</div>
        </div>
        <table border="1">
          <thead>
            <tr>
              {/* <th>拖动</th> */}
              <th colSpan={2}>基金名称</th>
              <th>基金代码</th>
              <th>单位净值</th>
              <th>今日估值</th>
              <th>今日收益比</th>
              <th>今日实际收益比</th>
              <th>持仓份额</th>
              <th>总投入</th>
              <th>今日收益</th>
              <th>总收益</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id='list'>
            {_showList}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={8}></th>
              <th>{_allMoney}</th>
              <th className={classnames(_today > 0 ? 'red' : 'green','tooltip')} data-percentage={`${(_today/_allMoney*100).toFixed(2)}%`}>￥{_today.toFixed(2)}</th>
              <th className={classnames(_all > 0 ? 'red' : 'green','tooltip')} data-percentage={`${(_all/_allMoney*100).toFixed(2)}%`}>￥{_all.toFixed(2)}</th>
              <th>{`${timeCut}秒后刷新`}</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
        <div className='Import'>
          <input type="text" placeholder='输入历史数据' value={inputJson} onChange={e => this.setState({inputJson:e.target.value})}/>
          <div className='btn blue' onClick={() => this.importJson()}>导入json</div>
        </div>
        <div id='saveJSON' className='btn' data-clipboard-text={JSON.stringify(localStorage.getItem('fund'))} onClick={()=>alert('复制成功')}>
          保存数据
        </div>
        <div id='editor' className='btn' style={{marginLeft:'10px'}} onClick={() => this.editor()}>
          {isEditor?'完成编辑':'编辑模式'}
        </div>
        <div className='btn blue' onClick={() => this.getFundDatas(true)}>刷新</div>
        <p style={{ textAlign: 'right' }}>当前{`${totalUpdateNum}/${_showList.length}个基金已更新收益`}</p>
        <p style={{ textAlign: 'right' }}>{`当日收益${round(_today / _allMoney * 100)}%,跑输大盘${round(_today / _allMoney * 100+0.23)}%`}</p>
        <div className="boardList">
          {boardList}
        </div>
      </div>
    );
  }
}


export default App;
