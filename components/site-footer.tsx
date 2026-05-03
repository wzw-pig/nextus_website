export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <img src="/logo.png" alt="NextUs Logo" className="footer-logo" />
              <h3>NextUs</h3>
              <p>汇聚创新思维，点燃竞技激情</p>
            </div>
          </div>

          <div className="footer-section">
            <h4>快速链接</h4>
            <ul className="footer-links">
              <li><a href="/#about">团队简介</a></li>
              <li><a href="/#projects">历史项目</a></li>
              <li><a href="/#tech">技术栈</a></li>
              <li><a href="/#organization">组织架构</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>加入我们</h4>
            <ul className="footer-links">
              <li><a href="/#recruitment">加入我们</a></li>
              <li><a href="/#contact">联系我们</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>关注我们</h4>
            <div className="footer-links">
              <li><a href="https://mp.weixin.qq.com/s/vXu6xYJiqkPwqq7r9WQQ2A" target="_blank" rel="noopener noreferrer">微信公众号</a></li>
              <li><a href="https://xhslink.com/m/9PEVyPJo8sC" target="_blank" rel="noopener noreferrer">小红书</a></li>
              <li><a href="https://v.douyin.com/46dfoBY5i0I" target="_blank" rel="noopener noreferrer">抖音</a></li>
            </div>
          </div>
        </div>

        <div className="footer-divider"></div>
        <div className="footer-bottom-content">
          <p>Copyright © 2026 上海工程技术大学NextUs竞赛团队 版权所有</p>
          {/* 由王志伟开发 */}
        </div>
      </div>
    </footer>
  );
}
