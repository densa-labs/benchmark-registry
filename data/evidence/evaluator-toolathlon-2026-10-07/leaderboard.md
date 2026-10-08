> ## Documentation Index
> Fetch the complete documentation index at: https://toolathlon.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Model Leaderboard

<div className="leaderboard-container">
  <div className="stats-container">
    <div className="stat-card">
      <div className="stat-number">108</div>
      <div className="stat-label"># Tasks</div>
    </div>

    <div className="stat-card">
      <div className="stat-number">32 <sub>(604)</sub></div>
      <div className="stat-label"># MCP servers <sub>(# tools)</sub></div>
    </div>

    <div className="stat-card">
      <div className="stat-number">7 <sub>(16)</sub></div>
      <div className="stat-label"># Local toolkits <sub>(# tools)</sub></div>
    </div>

    <div className="stat-card">
      <div className="stat-number">76.2%</div>
      <div className="stat-label">Best Pass\@1 Score</div>
    </div>
  </div>

  <p style={{ marginBottom: '24px', fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
    Follow our <a href="https://toolathlon.xyz/docs/submit" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline', textDecorationColor: '#3b82f6', textUnderlineOffset: '2px' }}>submission guide</a> to add your agent or model to the leaderboard.
  </p>

  <div className="leaderboard-version-note" role="note" aria-label="Toolathlon-Verified leaderboard information">
    <div className="leaderboard-version-note-header">
      <span className="leaderboard-version-note-title">Toolathlon-Verified</span>
      <span className="leaderboard-version-note-date">Current benchmark · Released June 30, 2026</span>
    </div>

    <p>The results below use Toolathlon-Verified, a major revision that improves the alignment of task specifications, ground truth, evaluators, initial states, and evaluation infrastructure. Toolathlon-Verified begins a new official score series, so these results are not directly comparable with scores from earlier versions of Toolathlon. <a href="/docs/blog/toolathlon-verified">Learn what changed →</a></p>
  </div>

  <div className="category-section">
    <div className="leaderboard-current-scroll">
      <table className="performance-table leaderboard-current-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Type</th>
            <th>Agent</th>
            <th>Date</th>
            <th>Pass\@1</th>
            <th>Pass\@3</th>
            <th>Pass^3</th>
            <th aria-label="Average turns per task" title="Mean number of conversation turns per task, including the initial user turn."># Turns</th>
            <th aria-label="Average tool calls per task" title="Mean number of individual tool invocations per task; parallel calls are counted separately."># Tool Calls</th>
          </tr>
        </thead>

        <tbody>
          <tr className="rank-1">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Z.ai</title><path d="M12.105 2L9.927 4.953H.653L2.83 2h9.276zM23.254 19.048L21.078 22h-9.242l2.174-2.952h9.244zM24 2L9.264 22H0L14.736 2H24z" /></svg> GLM 5.3 Flash (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-08-30</td>
            <td className="score-cell best-score" data-label="Pass@1">78.4<sub>± 1.9</sub></td>
            <td className="score-cell" data-label="Pass@3">--</td>
            <td className="score-cell" data-label="Pass^3">--</td>
            <td className="score-cell" data-label="# Turns">--</td>
            <td className="score-cell" data-label="# Tool Calls">--</td>
          </tr>

          <tr className="rank-2">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> Kimi K3 (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-16</td>
            <td className="score-cell" data-label="Pass@1">76.5<sub>± 1.9</sub></td>
            <td className="score-cell" data-label="Pass@3">83.3</td>
            <td className="score-cell best-score" data-label="Pass^3">68.5</td>
            <td className="score-cell" data-label="# Turns">22.8</td>
            <td className="score-cell" data-label="# Tool Calls">39.1</td>
          </tr>

          <tr className="rank-3">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude Opus 4.8 (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-06-30</td>
            <td className="score-cell" data-label="Pass@1">76.2<sub>± 3.4</sub></td>
            <td className="score-cell" data-label="Pass@3">84.3</td>
            <td className="score-cell" data-label="Pass^3">66.7</td>
            <td className="score-cell" data-label="# Turns">19.9</td>
            <td className="score-cell" data-label="# Tool Calls">36.3</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#0467DF" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>Meta</title><path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" /></svg> Muse Spark 1.2 (xhigh)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-08-05</td>
            <td className="score-cell" data-label="Pass@1">75.9<sub>± 1.3</sub></td>
            <td className="score-cell best-score" data-label="Pass@3">87.0</td>
            <td className="score-cell" data-label="Pass^3">63.0</td>
            <td className="score-cell" data-label="# Turns">44.2</td>
            <td className="score-cell" data-label="# Tool Calls">48.6</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#0467DF" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>Meta</title><path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" /></svg> Muse Spark 1.1 (xhigh)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-09</td>
            <td className="score-cell" data-label="Pass@1">75.6<sub>± 0.4</sub></td>
            <td className="score-cell" data-label="Pass@3">86.1</td>
            <td className="score-cell" data-label="Pass^3">63.9</td>
            <td className="score-cell" data-label="# Turns">28.9</td>
            <td className="score-cell" data-label="# Tool Calls">42.7</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://avatars.githubusercontent.com/u/148330874?s=80&v=4" alt="" aria-hidden="true" />DeepSeek V4 Pro 0813 (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-08-13</td>
            <td className="score-cell" data-label="Pass@1">74.4<sub>± 1.2</sub></td>
            <td className="score-cell" data-label="Pass@3">--</td>
            <td className="score-cell" data-label="Pass^3">--</td>
            <td className="score-cell" data-label="# Turns">--</td>
            <td className="score-cell" data-label="# Tool Calls">--</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> GPT-5.5 (xhigh)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-06-30</td>
            <td className="score-cell" data-label="Pass@1">73.5<sub>± 1.2</sub></td>
            <td className="score-cell" data-label="Pass@3">82.4</td>
            <td className="score-cell" data-label="Pass^3">62.0</td>
            <td className="score-cell" data-label="# Turns">24.4</td>
            <td className="score-cell" data-label="# Tool Calls">37.8</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude Sonnet 5 (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-01</td>
            <td className="score-cell" data-label="Pass@1">71.6<sub>± 1.2</sub></td>
            <td className="score-cell" data-label="Pass@3">83.3</td>
            <td className="score-cell" data-label="Pass^3">53.7</td>
            <td className="score-cell" data-label="# Turns">27.1</td>
            <td className="score-cell" data-label="# Tool Calls">51.5</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://avatars.githubusercontent.com/u/148330874?s=80&v=4" alt="" aria-hidden="true" />DeepSeek V4 Flash 0731 (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-31</td>
            <td className="score-cell" data-label="Pass@1">70.7<sub>± 0.9</sub></td>
            <td className="score-cell" data-label="Pass@3">81.5</td>
            <td className="score-cell" data-label="Pass^3">58.3</td>
            <td className="score-cell" data-label="# Turns">26.3</td>
            <td className="score-cell" data-label="# Tool Calls">49.0</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini 3.5 Flash (high)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-06-30</td>
            <td className="score-cell" data-label="Pass@1">67.3<sub>± 1.2</sub></td>
            <td className="score-cell" data-label="Pass@3">79.6</td>
            <td className="score-cell" data-label="Pass^3">53.7</td>
            <td className="score-cell" data-label="# Turns">45.3</td>
            <td className="score-cell" data-label="# Tool Calls">45.6</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini 3.1 Pro (high)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-01</td>
            <td className="score-cell" data-label="Pass@1">61.1<sub>± 1.3</sub></td>
            <td className="score-cell" data-label="Pass@3">72.2</td>
            <td className="score-cell" data-label="Pass^3">48.1</td>
            <td className="score-cell" data-label="# Turns">26.2</td>
            <td className="score-cell" data-label="# Tool Calls">32.2</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Z.ai</title><path d="M12.105 2L9.927 4.953H.653L2.83 2h9.276zM23.254 19.048L21.078 22h-9.242l2.174-2.952h9.244zM24 2L9.264 22H0L14.736 2H24z" /></svg> GLM 5.2 (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-06-30</td>
            <td className="score-cell" data-label="Pass@1">59.9<sub>± 1.9</sub></td>
            <td className="score-cell" data-label="Pass@3">78.7</td>
            <td className="score-cell" data-label="Pass^3">41.7</td>
            <td className="score-cell" data-label="# Turns">23.3</td>
            <td className="score-cell" data-label="# Tool Calls">41.9</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> Kimi K2.6<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-15</td>
            <td className="score-cell" data-label="Pass@1">58.0<sub>± 4.9</sub></td>
            <td className="score-cell" data-label="Pass@3">72.2</td>
            <td className="score-cell" data-label="Pass^3">41.7</td>
            <td className="score-cell" data-label="# Turns">30.8</td>
            <td className="score-cell" data-label="# Tool Calls">42.3</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> Kimi K2.7 Code<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-06-30</td>
            <td className="score-cell" data-label="Pass@1">58.0<sub>± 4.3</sub></td>
            <td className="score-cell" data-label="Pass@3">74.1</td>
            <td className="score-cell" data-label="Pass^3">41.7</td>
            <td className="score-cell" data-label="# Turns">23.1</td>
            <td className="score-cell" data-label="# Tool Calls">37.6</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /></svg> Gemini 3.5 Flash-Lite (high)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Proprietary</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-30</td>
            <td className="score-cell" data-label="Pass@1">57.1<sub>± 3.6</sub></td>
            <td className="score-cell" data-label="Pass@3">71.3</td>
            <td className="score-cell" data-label="Pass^3">41.7</td>
            <td className="score-cell" data-label="# Turns">37.9</td>
            <td className="score-cell" data-label="# Tool Calls">38.3</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://avatars.githubusercontent.com/u/210980732?s=80&v=4" alt="" aria-hidden="true" />Hy3 (high)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-30</td>
            <td className="score-cell" data-label="Pass@1">56.8<sub>± 3.7</sub></td>
            <td className="score-cell" data-label="Pass@3">72.2</td>
            <td className="score-cell" data-label="Pass^3">40.7</td>
            <td className="score-cell" data-label="# Turns">20.5</td>
            <td className="score-cell" data-label="# Tool Calls">37.9</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#4D6BFE" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" /></svg> DeepSeek V4 Pro (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-06-30</td>
            <td className="score-cell" data-label="Pass@1">55.9<sub>± 1.2</sub></td>
            <td className="score-cell" data-label="Pass@3">68.5</td>
            <td className="score-cell" data-label="Pass^3">41.7</td>
            <td className="score-cell" data-label="# Turns">23.6</td>
            <td className="score-cell" data-label="# Tool Calls">39.1</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://avatars.githubusercontent.com/u/220441404?s=80&v=4" alt="" aria-hidden="true" />Inkling-Small (xhigh)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-30</td>
            <td className="score-cell" data-label="Pass@1">54.4<sub>± 3.2</sub></td>
            <td className="score-cell" data-label="Pass@3">66.9</td>
            <td className="score-cell" data-label="Pass^3">38.4</td>
            <td className="score-cell" data-label="# Turns">48.4</td>
            <td className="score-cell" data-label="# Tool Calls">46.9</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#4D6BFE" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" /></svg> DeepSeek V4 Flash (max)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-30</td>
            <td className="score-cell" data-label="Pass@1">50.9<sub>± 1.5</sub></td>
            <td className="score-cell" data-label="Pass@3">63.9</td>
            <td className="score-cell" data-label="Pass^3">35.2</td>
            <td className="score-cell" data-label="# Turns">28.6</td>
            <td className="score-cell" data-label="# Tool Calls">47.1</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://cdn.cnbj1.fds.api.mi-img.com/aife/mimo-blog-fe/doc_build/mimo.ico" alt="" aria-hidden="true" />MiMo V2.5<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-30</td>
            <td className="score-cell" data-label="Pass@1">49.1<sub>± 3.9</sub></td>
            <td className="score-cell" data-label="Pass@3">65.7</td>
            <td className="score-cell" data-label="Pass^3">30.6</td>
            <td className="score-cell" data-label="# Turns">23.2</td>
            <td className="score-cell" data-label="# Tool Calls">38.5</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://avatars.githubusercontent.com/u/194880281?s=80&v=4" alt="" aria-hidden="true" />MiniMax M2.7<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-30</td>
            <td className="score-cell" data-label="Pass@1">47.5<sub>± 3.8</sub></td>
            <td className="score-cell" data-label="Pass@3">62.0</td>
            <td className="score-cell" data-label="Pass^3">32.4</td>
            <td className="score-cell" data-label="# Turns">24.6</td>
            <td className="score-cell" data-label="# Tool Calls">43.2</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://avatars.githubusercontent.com/u/220441404?s=80&v=4" alt="" aria-hidden="true" />Inkling (xhigh)<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-15</td>
            <td className="score-cell" data-label="Pass@1">45.5<sub>± 3.7</sub></td>
            <td className="score-cell" data-label="Pass@3">63.8</td>
            <td className="score-cell" data-label="Pass^3">25.5</td>
            <td className="score-cell" data-label="# Turns">47.3</td>
            <td className="score-cell" data-label="# Tool Calls">50.2</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><img className="org-icon" src="https://avatars.githubusercontent.com/u/141221163?s=80&v=4" alt="" aria-hidden="true" />Qwen3.5 397B-A17B<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-30</td>
            <td className="score-cell" data-label="Pass@1">40.7<sub>± 2.0</sub></td>
            <td className="score-cell" data-label="Pass@3">51.9</td>
            <td className="score-cell" data-label="Pass^3">27.8</td>
            <td className="score-cell" data-label="# Turns">19.5</td>
            <td className="score-cell" data-label="# Tool Calls">35.7</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#76B900" width="20px" height="20px" viewBox="0 0 271.7 179.7" xmlns="http://www.w3.org/2000/svg"><title>NVIDIA</title><path d="M101.3,53.6V37.4c1.6-0.1,3.2-0.2,4.8-0.2c44.4-1.4,73.5,38.2,73.5,38.2S148.2,119,114.5,119c-4.5,0-8.9-0.7-13.1-2.1V67.7c17.3,2.1,20.8,9.7,31.1,27l23.1-19.4c0,0-16.9-22.1-45.3-22.1C107.3,53.1,104.3,53.3,101.3,53.6 M101.3,0v24.2c1.6-0.1,3.2-0.2,4.8-0.3c61.7-2.1,102,50.6,102,50.6s-46.2,56.2-94.3,56.2c-4.2,0-8.3-0.4-12.4-1.1v15c3.4,0.4,6.9,0.7,10.3,0.7c44.8,0,77.2-22.9,108.6-49.9c5.2,4.2,26.5,14.3,30.9,18.7c-29.8,25-99.3,45.1-138.7,45.1c-3.8,0-7.4-0.2-11-0.6v21.1h170.2V0L101.3,0z M101.3,116.9v12.8c-41.4-7.4-52.9-50.5-52.9-50.5s19.9-22,52.9-25.6v14h-0.1c-17.3-2.1-30.9,14.1-30.9,14.1S78,109,101.3,116.9 M27.8,77.4c0,0,24.5-36.2,73.6-40V24.2C47,28.6,0,74.6,0,74.6s26.6,77,101.3,84v-14C46.5,137.8,27.8,77.4,27.8,77.4z" /></svg>Nemotron 3 Ultra<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-15</td>
            <td className="score-cell" data-label="Pass@1">34.3<sub>± 1.5</sub></td>
            <td className="score-cell" data-label="Pass@3">50.0</td>
            <td className="score-cell" data-label="Pass^3">19.4</td>
            <td className="score-cell" data-label="# Turns">28.6</td>
            <td className="score-cell" data-label="# Tool Calls">31.9</td>
          </tr>

          <tr className="rank-other">
            <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> Kimi K2.5<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
            <td className="model-type-cell" data-label="Model Type">Open-Weights</td>
            <td className="text-cell" data-label="Agent">Default</td>
            <td className="date-cell" data-label="Date">2026-07-15</td>
            <td className="score-cell" data-label="Pass@1">33.0<sub>± 1.2</sub></td>
            <td className="score-cell" data-label="Pass@3">50.9</td>
            <td className="score-cell" data-label="Pass^3">15.7</td>
            <td className="score-cell" data-label="# Turns">20.3</td>
            <td className="score-cell" data-label="# Tool Calls">31.3</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div className="legend-section">
    <p className="legend-text">
      <span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span> Results bearing this badge were independently evaluated by us.
    </p>

    <p className="legend-text">
      Turns count how many sequential rounds the agent takes. Tool Calls count individual actions performed through tools; one turn can include several calls executed in parallel. Both values are per-task averages over the same runs with valid trajectories.
    </p>
  </div>

  <div className="leaderboard-history-native">
    <Accordion title="Previous Toolathlon leaderboard" description="Snapshot before Toolathlon-Verified · 51 models" id="previous-toolathlon-leaderboard" defaultOpen={false}>
      <div className="leaderboard-history-content">
        <p className="leaderboard-history-note">This archived snapshot shows the leaderboard immediately before Toolathlon-Verified. It is retained for historical context; these scores use earlier task definitions and evaluation infrastructure and are not directly comparable with the Verified results above.</p>

        <div className="leaderboard-history-scroll">
          <div className="category-section leaderboard-history-category">
            <table className="performance-table leaderboard-history-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Type</th>
                  <th>Agent</th>
                  <th>Date</th>
                  <th>Pass\@1</th>
                  <th>Pass\@3</th>
                  <th>Pass^3</th>
                  <th># Turns</th>
                </tr>
              </thead>

              <tbody>
                <tr className="rank-1">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg>Gemini-3.5-Flash<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-05-19</td>
                  <td className="score-cell best-score" data-label="Pass@1">56.5<sub>± 2.7</sub></td>
                  <td className="score-cell best-score" data-label="Pass@3">68.5</td>
                  <td className="score-cell best-score" data-label="Pass^3">43.5</td>
                  <td className="score-cell" data-label="# Turns">44.7</td>
                </tr>

                <tr className="rank-2">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> <a href="https://openai.com/index/introducing-gpt-5-5/">GPT-5.5-xhigh</a></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-24</td>
                  <td className="score-cell" data-label="Pass@1">55.6</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-3">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> <a href="https://openai.com/index/introducing-gpt-5-4/">GPT-5.4-xhigh</a></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-06</td>
                  <td className="score-cell">54.6</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#4D6BFE" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" /></svg> DeepSeek-V4-Pro Max<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-25</td>
                  <td className="score-cell" data-label="Pass@1">52.8<sub>± 1.9</sub></td>
                  <td className="score-cell" data-label="Pass@3">63.9</td>
                  <td className="score-cell" data-label="Pass^3">38.9</td>
                  <td className="score-cell" data-label="# Turns">24.1</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude-Opus-4.7<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-25</td>
                  <td className="score-cell" data-label="Pass@1">52.8<sup>†</sup></td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">16.2</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> <a href="https://openai.com/index/introducing-gpt-5-4/">GPT-5.3-Codex-xhigh</a></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-06</td>
                  <td className="score-cell" data-label="Pass@1">51.9</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> <a href="https://huggingface.co/moonshotai/Kimi-K2.6">Kimi-K2.6</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-21</td>
                  <td className="score-cell" data-label="Pass@1">50.0</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini-3-Flash<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-18</td>
                  <td className="score-cell" data-label="Pass@1">49.4<sub>± 0.4</sub></td>
                  <td className="score-cell" data-label="Pass@3">59.3</td>
                  <td className="score-cell" data-label="Pass^3">36.1</td>
                  <td className="score-cell" data-label="# Turns">28.6</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini-3.1-Pro<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-13</td>
                  <td className="score-cell" data-label="Pass@1">48.8<sub>± 2.3</sub></td>
                  <td className="score-cell" data-label="Pass@3">62.0</td>
                  <td className="score-cell" data-label="Pass^3">34.3</td>
                  <td className="score-cell" data-label="# Turns">27.9</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#4D6BFE" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" /></svg> DeepSeek-V4-Flash Max<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-25</td>
                  <td className="score-cell" data-label="Pass@1">48.2<sub>± 0.9</sub></td>
                  <td className="score-cell" data-label="Pass@3">57.4</td>
                  <td className="score-cell" data-label="Pass^3">37.0</td>
                  <td className="score-cell" data-label="# Turns">26.1</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude-Opus-4.6<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Claude Agent SDK</td>
                  <td className="date-cell" data-label="Date">2026-03-06</td>
                  <td className="score-cell" data-label="Pass@1">47.2<sup>†</sup></td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#E2167E" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>Minimax icon</title><path d="M16.278 2c1.156 0 2.093.927 2.093 2.07v12.501a.74.74 0 00.744.709.74.74 0 00.743-.709V9.099a2.06 2.06 0 012.071-2.049A2.06 2.06 0 0124 9.1v6.561a.649.649 0 01-.652.645.649.649 0 01-.653-.645V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v7.472a2.037 2.037 0 01-2.048 2.026 2.037 2.037 0 01-2.048-2.026v-12.5a.785.785 0 00-.788-.753.785.785 0 00-.789.752l-.001 15.904A2.037 2.037 0 0113.441 22a2.037 2.037 0 01-2.048-2.026V18.04c0-.356.292-.645.652-.645.36 0 .652.289.652.645v1.934c0 .263.142.506.372.638.23.131.514.131.744 0a.734.734 0 00.372-.638V4.07c0-1.143.937-2.07 2.093-2.07zm-5.674 0c1.156 0 2.093.927 2.093 2.07v11.523a.648.648 0 01-.652.645.648.648 0 01-.652-.645V4.07a.785.785 0 00-.789-.78.785.785 0 00-.789.78v14.013a2.06 2.06 0 01-2.07 2.048 2.06 2.06 0 01-2.071-2.048V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v3.8a2.06 2.06 0 01-2.071 2.049A2.06 2.06 0 010 12.9v-1.378c0-.357.292-.646.652-.646.36 0 .653.29.653.646V12.9c0 .418.343.757.766.757s.766-.339.766-.757V9.099a2.06 2.06 0 012.07-2.048 2.06 2.06 0 012.071 2.048v8.984c0 .419.343.758.767.758.423 0 .766-.339.766-.758V4.07c0-1.143.937-2.07 2.093-2.07z" /></svg><a href="https://www.minimax.io/news/minimax-m27-en">MiniMax-M2.7</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-18</td>
                  <td className="score-cell" data-label="Pass@1">46.3</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude-Sonnet-4.6<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-02-23</td>
                  <td className="score-cell" data-label="Pass@1">44.8<sub>± 2.9</sub></td>
                  <td className="score-cell" data-label="Pass@3">59.3</td>
                  <td className="score-cell" data-label="Pass^3">30.6</td>
                  <td className="score-cell" data-label="# Turns">23.4</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> GPT-5.2-xhigh<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span><sup>‡</sup></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-18</td>
                  <td className="score-cell" data-label="Pass@1">43.8<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">50.9</td>
                  <td className="score-cell" data-label="Pass^3">33.3</td>
                  <td className="score-cell" data-label="# Turns">28.2</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude-Opus-4.5<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-11-27</td>
                  <td className="score-cell" data-label="Pass@1">43.5<sub>± 0.8</sub></td>
                  <td className="score-cell" data-label="Pass@3">57.4</td>
                  <td className="score-cell" data-label="Pass^3">30.6</td>
                  <td className="score-cell" data-label="# Turns">18.7</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> <a href="https://openai.com/index/introducing-gpt-5-4-mini-and-nano/">GPT-5.4-mini-xhigh</a></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-17</td>
                  <td className="score-cell" data-label="Pass@1">42.9</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> GPT-5.2-high<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span><sup>‡</sup></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-17</td>
                  <td className="score-cell" data-label="Pass@1">41.7<sub>± 1.3</sub></td>
                  <td className="score-cell" data-label="Pass@3">54.6</td>
                  <td className="score-cell" data-label="Pass^3">28.7</td>
                  <td className="score-cell" data-label="# Turns">23.9</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#E2167E" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>Minimax icon</title><path d="M16.278 2c1.156 0 2.093.927 2.093 2.07v12.501a.74.74 0 00.744.709.74.74 0 00.743-.709V9.099a2.06 2.06 0 012.071-2.049A2.06 2.06 0 0124 9.1v6.561a.649.649 0 01-.652.645.649.649 0 01-.653-.645V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v7.472a2.037 2.037 0 01-2.048 2.026 2.037 2.037 0 01-2.048-2.026v-12.5a.785.785 0 00-.788-.753.785.785 0 00-.789.752l-.001 15.904A2.037 2.037 0 0113.441 22a2.037 2.037 0 01-2.048-2.026V18.04c0-.356.292-.645.652-.645.36 0 .652.289.652.645v1.934c0 .263.142.506.372.638.23.131.514.131.744 0a.734.734 0 00.372-.638V4.07c0-1.143.937-2.07 2.093-2.07zm-5.674 0c1.156 0 2.093.927 2.093 2.07v11.523a.648.648 0 01-.652.645.648.648 0 01-.652-.645V4.07a.785.785 0 00-.789-.78.785.785 0 00-.789.78v14.013a2.06 2.06 0 01-2.07 2.048 2.06 2.06 0 01-2.071-2.048V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v3.8a2.06 2.06 0 01-2.071 2.049A2.06 2.06 0 010 12.9v-1.378c0-.357.292-.646.652-.646.36 0 .653.29.653.646V12.9c0 .418.343.757.766.757s.766-.339.766-.757V9.099a2.06 2.06 0 012.07-2.048 2.06 2.06 0 012.071 2.048v8.984c0 .419.343.758.767.758.423 0 .766-.339.766-.758V4.07c0-1.143.937-2.07 2.093-2.07z" /></svg>MiniMax-M2.1<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-25</td>
                  <td className="score-cell" data-label="Pass@1">40.7<sub>± 0.8</sub></td>
                  <td className="score-cell" data-label="Pass@3">51.9</td>
                  <td className="score-cell" data-label="Pass^3">27.8</td>
                  <td className="score-cell" data-label="# Turns">17.8</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>ChatGLM</title><defs><linearGradient id="lobe-icons-chat-glm-fill" x1="-18.756%" x2="70.894%" y1="49.371%" y2="90.944%"><stop offset="0%" stop-color="#504AF4" /><stop offset="100%" stop-color="#3485FF" /></linearGradient></defs><path d="M9.917 2c4.906 0 10.178 3.947 8.93 10.58-.014.07-.037.14-.057.21l-.003-.277c-.083-3-1.534-8.934-8.87-8.934-3.393 0-8.137 3.054-7.93 8.158-.04 4.778 3.555 8.4 7.95 8.332l.073-.001c1.2-.033 2.763-.429 3.1-1.657.063-.031.26.534.268.598.048.256.112.369.192.34.981-.348 2.286-1.222 1.952-2.38-.176-.61-1.775-.147-1.921-.347.418-.979 2.234-.926 3.153-.716.443.102.657.38 1.012.442.29.052.981-.2.96.242-1.5 3.042-4.893 5.41-8.808 5.41C3.654 22 0 16.574 0 11.737 0 5.947 4.959 2 9.917 2zM9.9 5.3c.484 0 1.125.225 1.38.585 3.669.145 4.313 2.686 4.694 5.444.255 1.838.315 2.3.182 1.387l.083.59c.068.448.554.737.982.516.144-.075.254-.231.328-.47a.2.2 0 01.258-.13l.625.22a.2.2 0 01.124.238 2.172 2.172 0 01-.51.92c-.878.917-2.757.664-3.08-.62-.14-.554-.055-.626-.345-1.242-.292-.621-1.238-.709-1.69-.295-.345.315-.407.805-.406 1.282L12.6 15.9a.9.9 0 01-.9.9h-1.4a.9.9 0 01-.9-.9v-.65a1.15 1.15 0 10-2.3 0v.65a.9.9 0 01-.9.9H4.8a.9.9 0 01-.9-.9l.035-3.239c.012-1.884.356-3.658 2.47-4.134.2-.045.252.13.29.342.025.154.043.252.053.294.701 3.058 1.75 4.299 3.144 3.722l.66-.331.254-.13c.158-.082.25-.131.276-.15.012-.01-.165-.206-.407-.464l-1.012-1.067a8.925 8.925 0 01-.199-.216c-.047-.034-.116.068-.208.306-.074.157-.251.252-.272.326-.013.058.108.298.362.72.164.288.22.508-.31.343-1.04-.8-1.518-2.273-1.684-3.725-.004-.035-.162-1.913-.162-1.913a1.2 1.2 0 011.113-1.281L9.9 5.3zm12.994 8.68c.037.697-.403.704-1.213.591l-1.783-.276c-.265-.053-.385-.099-.313-.147.47-.315 3.268-.93 3.31-.168zm-.915-.083l-.926.042c-.85.077-1.452.24.338.336l.103.003c.815.012 1.264-.359.485-.381zm1.667-3.601h.01c.79.398.067 1.03-.65 1.393-.14.07-.491.176-1.052.315-.241.04-.457.092-.333.16l.01.005c1.952.958-3.123 1.534-2.495 1.285l.38-.148c.68-.266 1.614-.682 1.666-1.337.038-.48 1.253-.442 1.493-.968.048-.106 0-.236-.144-.389-.05-.047-.094-.094-.107-.148-.073-.305.7-.431 1.222-.168zm-2.568-.474c-.135 1.198-2.479 4.192-1.949 2.863l.017-.042c.298-.717.376-2.221 1.337-3.221.25-.26.636.035.595.4zm-7.976-.253c.02-.694 1.002-.968 1.346-.347.01-1.274-1.941-.768-1.346.347z" fill="url(#lobe-icons-chat-glm-fill)" fill-rule="evenodd" /></svg> <a href="https://z.ai/blog/glm-5.1">GLM-5.1</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-07</td>
                  <td className="score-cell" data-label="Pass@1">40.7</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero" /><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84" /><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84" /></linearGradient></defs></svg> <a href="https://qwen.ai/blog?id=qwen3.6">Qwen3.6-Plus</a></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-02</td>
                  <td className="score-cell" data-label="Pass@1">39.8</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>ChatGLM</title><defs><linearGradient id="lobe-icons-chat-glm-fill" x1="-18.756%" x2="70.894%" y1="49.371%" y2="90.944%"><stop offset="0%" stop-color="#504AF4" /><stop offset="100%" stop-color="#3485FF" /></linearGradient></defs><path d="M9.917 2c4.906 0 10.178 3.947 8.93 10.58-.014.07-.037.14-.057.21l-.003-.277c-.083-3-1.534-8.934-8.87-8.934-3.393 0-8.137 3.054-7.93 8.158-.04 4.778 3.555 8.4 7.95 8.332l.073-.001c1.2-.033 2.763-.429 3.1-1.657.063-.031.26.534.268.598.048.256.112.369.192.34.981-.348 2.286-1.222 1.952-2.38-.176-.61-1.775-.147-1.921-.347.418-.979 2.234-.926 3.153-.716.443.102.657.38 1.012.442.29.052.981-.2.96.242-1.5 3.042-4.893 5.41-8.808 5.41C3.654 22 0 16.574 0 11.737 0 5.947 4.959 2 9.917 2zM9.9 5.3c.484 0 1.125.225 1.38.585 3.669.145 4.313 2.686 4.694 5.444.255 1.838.315 2.3.182 1.387l.083.59c.068.448.554.737.982.516.144-.075.254-.231.328-.47a.2.2 0 01.258-.13l.625.22a.2.2 0 01.124.238 2.172 2.172 0 01-.51.92c-.878.917-2.757.664-3.08-.62-.14-.554-.055-.626-.345-1.242-.292-.621-1.238-.709-1.69-.295-.345.315-.407.805-.406 1.282L12.6 15.9a.9.9 0 01-.9.9h-1.4a.9.9 0 01-.9-.9v-.65a1.15 1.15 0 10-2.3 0v.65a.9.9 0 01-.9.9H4.8a.9.9 0 01-.9-.9l.035-3.239c.012-1.884.356-3.658 2.47-4.134.2-.045.252.13.29.342.025.154.043.252.053.294.701 3.058 1.75 4.299 3.144 3.722l.66-.331.254-.13c.158-.082.25-.131.276-.15.012-.01-.165-.206-.407-.464l-1.012-1.067a8.925 8.925 0 01-.199-.216c-.047-.034-.116.068-.208.306-.074.157-.251.252-.272.326-.013.058.108.298.362.72.164.288.22.508-.31.343-1.04-.8-1.518-2.273-1.684-3.725-.004-.035-.162-1.913-.162-1.913a1.2 1.2 0 011.113-1.281L9.9 5.3zm12.994 8.68c.037.697-.403.704-1.213.591l-1.783-.276c-.265-.053-.385-.099-.313-.147.47-.315 3.268-.93 3.31-.168zm-.915-.083l-.926.042c-.85.077-1.452.24.338.336l.103.003c.815.012 1.264-.359.485-.381zm1.667-3.601h.01c.79.398.067 1.03-.65 1.393-.14.07-.491.176-1.052.315-.241.04-.457.092-.333.16l.01.005c1.952.958-3.123 1.534-2.495 1.285l.38-.148c.68-.266 1.614-.682 1.666-1.337.038-.48 1.253-.442 1.493-.968.048-.106 0-.236-.144-.389-.05-.047-.094-.094-.107-.148-.073-.305.7-.431 1.222-.168zm-2.568-.474c-.135 1.198-2.479 4.192-1.949 2.863l.017-.042c.298-.717.376-2.221 1.337-3.221.25-.26.636.035.595.4zm-7.976-.253c.02-.694 1.002-.968 1.346-.347.01-1.274-1.941-.768-1.346.347z" fill="url(#lobe-icons-chat-glm-fill)" fill-rule="evenodd" /></svg> GLM-5<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-02-13</td>
                  <td className="score-cell" data-label="Pass@1">39.2<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">51.9</td>
                  <td className="score-cell" data-label="Pass^3">25.9</td>
                  <td className="score-cell" data-label="# Turns">16.5</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude-Sonnet-4.5<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">38.9<sub>± 3.0</sub></td>
                  <td className="score-cell" data-label="Pass@3">52.8</td>
                  <td className="score-cell" data-label="Pass^3">20.4</td>
                  <td className="score-cell" data-label="# Turns">20.2</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#E2167E" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>Minimax icon</title><path d="M16.278 2c1.156 0 2.093.927 2.093 2.07v12.501a.74.74 0 00.744.709.74.74 0 00.743-.709V9.099a2.06 2.06 0 012.071-2.049A2.06 2.06 0 0124 9.1v6.561a.649.649 0 01-.652.645.649.649 0 01-.653-.645V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v7.472a2.037 2.037 0 01-2.048 2.026 2.037 2.037 0 01-2.048-2.026v-12.5a.785.785 0 00-.788-.753.785.785 0 00-.789.752l-.001 15.904A2.037 2.037 0 0113.441 22a2.037 2.037 0 01-2.048-2.026V18.04c0-.356.292-.645.652-.645.36 0 .652.289.652.645v1.934c0 .263.142.506.372.638.23.131.514.131.744 0a.734.734 0 00.372-.638V4.07c0-1.143.937-2.07 2.093-2.07zm-5.674 0c1.156 0 2.093.927 2.093 2.07v11.523a.648.648 0 01-.652.645.648.648 0 01-.652-.645V4.07a.785.785 0 00-.789-.78.785.785 0 00-.789.78v14.013a2.06 2.06 0 01-2.07 2.048 2.06 2.06 0 01-2.071-2.048V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v3.8a2.06 2.06 0 01-2.071 2.049A2.06 2.06 0 010 12.9v-1.378c0-.357.292-.646.652-.646.36 0 .653.29.653.646V12.9c0 .418.343.757.766.757s.766-.339.766-.757V9.099a2.06 2.06 0 012.07-2.048 2.06 2.06 0 012.071 2.048v8.984c0 .419.343.758.767.758.423 0 .766-.339.766-.758V4.07c0-1.143.937-2.07 2.093-2.07z" /></svg><a href="https://www.minimax.io/news/minimax-m27-en">MiniMax-M2.5</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-18</td>
                  <td className="score-cell" data-label="Pass@1">38.3</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero" /><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84" /><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84" /></linearGradient></defs></svg> <a href="https://qwen.ai/blog?id=qwen3.6">Qwen3.5-397B-A17B</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-02</td>
                  <td className="score-cell" data-label="Pass@1">38.3</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> GPT-5-high<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span><sup>‡</sup></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-17</td>
                  <td className="score-cell" data-label="Pass@1">37.7<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">50.9</td>
                  <td className="score-cell" data-label="Pass^3">19.4</td>
                  <td className="score-cell" data-label="# Turns">25.7</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero" /><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84" /><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84" /></linearGradient></defs></svg> Qwen3.5-Plus<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-02-21</td>
                  <td className="score-cell" data-label="Pass@1">37.7<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">49.1</td>
                  <td className="score-cell" data-label="Pass^3">25.9</td>
                  <td className="score-cell" data-label="# Turns">17.4</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> GPT-5.1-high<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span><sup>‡</sup></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-17</td>
                  <td className="score-cell" data-label="Pass@1">37.0<sub>± 2.7</sub></td>
                  <td className="score-cell" data-label="Pass@3">50.0</td>
                  <td className="score-cell" data-label="Pass^3">20.4</td>
                  <td className="score-cell" data-label="# Turns">19.0</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini-3-Pro<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-11-22</td>
                  <td className="score-cell" data-label="Pass@1">36.4<sub>± 0.4</sub></td>
                  <td className="score-cell" data-label="Pass@3">48.1</td>
                  <td className="score-cell" data-label="Pass^3">23.1</td>
                  <td className="score-cell" data-label="# Turns">19.0</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> <a href="https://openai.com/index/introducing-gpt-5-4-mini-and-nano/">GPT-5.4-nano-xhigh</a></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-17</td>
                  <td className="score-cell" data-label="Pass@1">35.5</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#4D6BFE" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" /></svg> DeepSeek-V3.2-Thinking<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-01</td>
                  <td className="score-cell" data-label="Pass@1">35.2<sub>± 0.8</sub></td>
                  <td className="score-cell" data-label="Pass@3">54.6</td>
                  <td className="score-cell" data-label="Pass^3">16.7</td>
                  <td className="score-cell" data-label="# Turns">43.7</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero" /><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84" /><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84" /></linearGradient></defs></svg> <a href="https://qwen.ai/blog?id=qwen3.6-35b-a3b">Qwen3.5-27B</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-17</td>
                  <td className="score-cell" data-label="Pass@1">31.5</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude-Sonnet-4<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">29.9<sub>± 1.6</sub></td>
                  <td className="score-cell" data-label="Pass@3">41.7</td>
                  <td className="score-cell" data-label="Pass^3">17.6</td>
                  <td className="score-cell" data-label="# Turns">27.3</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero" /><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84" /><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84" /></linearGradient></defs></svg> <a href="https://qwen.ai/blog?id=qwen3.6-35b-a3b">Qwen3.5-35BA3B</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-17</td>
                  <td className="score-cell" data-label="Pass@1">28.7</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> Kimi-K2.5<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-02-04</td>
                  <td className="score-cell" data-label="Pass@1">27.8<sub>± 0.8</sub></td>
                  <td className="score-cell" data-label="Pass@3">38.9</td>
                  <td className="score-cell" data-label="Pass^3">14.8</td>
                  <td className="score-cell" data-label="# Turns">17.2</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Grok</title><path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" /></svg> Grok-4<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">27.5<sub>± 1.7</sub></td>
                  <td className="score-cell" data-label="Pass@3">38.9</td>
                  <td className="score-cell" data-label="Pass^3">16.7</td>
                  <td className="score-cell" data-label="# Turns">20.3</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero" /><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84" /><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84" /></linearGradient></defs></svg> <a href="https://qwen.ai/blog?id=qwen3.6-35b-a3b">Qwen3.6-35BA3B</a></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-04-17</td>
                  <td className="score-cell" data-label="Pass@1">26.9</td>
                  <td className="score-cell" data-label="Pass@3">--</td>
                  <td className="score-cell" data-label="Pass^3">--</td>
                  <td className="score-cell" data-label="# Turns">--</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#D97757" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill-rule="nonzero" /></svg> Claude-Haiku-4.5<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">26.2<sub>± 1.9</sub></td>
                  <td className="score-cell" data-label="Pass@3">39.8</td>
                  <td className="score-cell" data-label="Pass^3">13.0</td>
                  <td className="score-cell" data-label="# Turns">21.9</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>ChatGLM</title><defs><linearGradient id="lobe-icons-chat-glm-fill" x1="-18.756%" x2="70.894%" y1="49.371%" y2="90.944%"><stop offset="0%" stop-color="#504AF4" /><stop offset="100%" stop-color="#3485FF" /></linearGradient></defs><path d="M9.917 2c4.906 0 10.178 3.947 8.93 10.58-.014.07-.037.14-.057.21l-.003-.277c-.083-3-1.534-8.934-8.87-8.934-3.393 0-8.137 3.054-7.93 8.158-.04 4.778 3.555 8.4 7.95 8.332l.073-.001c1.2-.033 2.763-.429 3.1-1.657.063-.031.26.534.268.598.048.256.112.369.192.34.981-.348 2.286-1.222 1.952-2.38-.176-.61-1.775-.147-1.921-.347.418-.979 2.234-.926 3.153-.716.443.102.657.38 1.012.442.29.052.981-.2.96.242-1.5 3.042-4.893 5.41-8.808 5.41C3.654 22 0 16.574 0 11.737 0 5.947 4.959 2 9.917 2zM9.9 5.3c.484 0 1.125.225 1.38.585 3.669.145 4.313 2.686 4.694 5.444.255 1.838.315 2.3.182 1.387l.083.59c.068.448.554.737.982.516.144-.075.254-.231.328-.47a.2.2 0 01.258-.13l.625.22a.2.2 0 01.124.238 2.172 2.172 0 01-.51.92c-.878.917-2.757.664-3.08-.62-.14-.554-.055-.626-.345-1.242-.292-.621-1.238-.709-1.69-.295-.345.315-.407.805-.406 1.282L12.6 15.9a.9.9 0 01-.9.9h-1.4a.9.9 0 01-.9-.9v-.65a1.15 1.15 0 10-2.3 0v.65a.9.9 0 01-.9.9H4.8a.9.9 0 01-.9-.9l.035-3.239c.012-1.884.356-3.658 2.47-4.134.2-.045.252.13.29.342.025.154.043.252.053.294.701 3.058 1.75 4.299 3.144 3.722l.66-.331.254-.13c.158-.082.25-.131.276-.15.012-.01-.165-.206-.407-.464l-1.012-1.067a8.925 8.925 0 01-.199-.216c-.047-.034-.116.068-.208.306-.074.157-.251.252-.272.326-.013.058.108.298.362.72.164.288.22.508-.31.343-1.04-.8-1.518-2.273-1.684-3.725-.004-.035-.162-1.913-.162-1.913a1.2 1.2 0 011.113-1.281L9.9 5.3zm12.994 8.68c.037.697-.403.704-1.213.591l-1.783-.276c-.265-.053-.385-.099-.313-.147.47-.315 3.268-.93 3.31-.168zm-.915-.083l-.926.042c-.85.077-1.452.24.338.336l.103.003c.815.012 1.264-.359.485-.381zm1.667-3.601h.01c.79.398.067 1.03-.65 1.393-.14.07-.491.176-1.052.315-.241.04-.457.092-.333.16l.01.005c1.952.958-3.123 1.534-2.495 1.285l.38-.148c.68-.266 1.614-.682 1.666-1.337.038-.48 1.253-.442 1.493-.968.048-.106 0-.236-.144-.389-.05-.047-.094-.094-.107-.148-.073-.305.7-.431 1.222-.168zm-2.568-.474c-.135 1.198-2.479 4.192-1.949 2.863l.017-.042c.298-.717.376-2.221 1.337-3.221.25-.26.636.035.595.4zm-7.976-.253c.02-.694 1.002-.968 1.346-.347.01-1.274-1.941-.768-1.346.347z" fill="url(#lobe-icons-chat-glm-fill)" fill-rule="evenodd" /></svg> GLM-4.7<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-12-25</td>
                  <td className="score-cell" data-label="Pass@1">23.8<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">36.1</td>
                  <td className="score-cell" data-label="Pass^3">10.2</td>
                  <td className="score-cell" data-label="# Turns">27.8</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="#4D6BFE" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" /></svg> DeepSeek-V3.2-Exp<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">20.1<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">27.8</td>
                  <td className="score-cell" data-label="Pass^3">12.0</td>
                  <td className="score-cell" data-label="# Turns">26.0</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>ChatGLM</title><defs><linearGradient id="lobe-icons-chat-glm-fill" x1="-18.756%" x2="70.894%" y1="49.371%" y2="90.944%"><stop offset="0%" stop-color="#504AF4" /><stop offset="100%" stop-color="#3485FF" /></linearGradient></defs><path d="M9.917 2c4.906 0 10.178 3.947 8.93 10.58-.014.07-.037.14-.057.21l-.003-.277c-.083-3-1.534-8.934-8.87-8.934-3.393 0-8.137 3.054-7.93 8.158-.04 4.778 3.555 8.4 7.95 8.332l.073-.001c1.2-.033 2.763-.429 3.1-1.657.063-.031.26.534.268.598.048.256.112.369.192.34.981-.348 2.286-1.222 1.952-2.38-.176-.61-1.775-.147-1.921-.347.418-.979 2.234-.926 3.153-.716.443.102.657.38 1.012.442.29.052.981-.2.96.242-1.5 3.042-4.893 5.41-8.808 5.41C3.654 22 0 16.574 0 11.737 0 5.947 4.959 2 9.917 2zM9.9 5.3c.484 0 1.125.225 1.38.585 3.669.145 4.313 2.686 4.694 5.444.255 1.838.315 2.3.182 1.387l.083.59c.068.448.554.737.982.516.144-.075.254-.231.328-.47a.2.2 0 01.258-.13l.625.22a.2.2 0 01.124.238 2.172 2.172 0 01-.51.92c-.878.917-2.757.664-3.08-.62-.14-.554-.055-.626-.345-1.242-.292-.621-1.238-.709-1.69-.295-.345.315-.407.805-.406 1.282L12.6 15.9a.9.9 0 01-.9.9h-1.4a.9.9 0 01-.9-.9v-.65a1.15 1.15 0 10-2.3 0v.65a.9.9 0 01-.9.9H4.8a.9.9 0 01-.9-.9l.035-3.239c.012-1.884.356-3.658 2.47-4.134.2-.045.252.13.29.342.025.154.043.252.053.294.701 3.058 1.75 4.299 3.144 3.722l.66-.331.254-.13c.158-.082.25-.131.276-.15.012-.01-.165-.206-.407-.464l-1.012-1.067a8.925 8.925 0 01-.199-.216c-.047-.034-.116.068-.208.306-.074.157-.251.252-.272.326-.013.058.108.298.362.72.164.288.22.508-.31.343-1.04-.8-1.518-2.273-1.684-3.725-.004-.035-.162-1.913-.162-1.913a1.2 1.2 0 011.113-1.281L9.9 5.3zm12.994 8.68c.037.697-.403.704-1.213.591l-1.783-.276c-.265-.053-.385-.099-.313-.147.47-.315 3.268-.93 3.31-.168zm-.915-.083l-.926.042c-.85.077-1.452.24.338.336l.103.003c.815.012 1.264-.359.485-.381zm1.667-3.601h.01c.79.398.067 1.03-.65 1.393-.14.07-.491.176-1.052.315-.241.04-.457.092-.333.16l.01.005c1.952.958-3.123 1.534-2.495 1.285l.38-.148c.68-.266 1.614-.682 1.666-1.337.038-.48 1.253-.442 1.493-.968.048-.106 0-.236-.144-.389-.05-.047-.094-.094-.107-.148-.073-.305.7-.431 1.222-.168zm-2.568-.474c-.135 1.198-2.479 4.192-1.949 2.863l.017-.042c.298-.717.376-2.221 1.337-3.221.25-.26.636.035.595.4zm-7.976-.253c.02-.694 1.002-.968 1.346-.347.01-1.274-1.941-.768-1.346.347z" fill="url(#lobe-icons-chat-glm-fill)" fill-rule="evenodd" /></svg> GLM-4.6<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">18.8<sub>± 2.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">29.6</td>
                  <td className="score-cell" data-label="Pass^3">9.3</td>
                  <td className="score-cell" data-label="# Turns">27.9</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Grok</title><path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" /></svg> Grok-Code-Fast-1<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">18.5<sub>± 2.0</sub></td>
                  <td className="score-cell" data-label="Pass@3">30.6</td>
                  <td className="score-cell" data-label="Pass^3">9.3</td>
                  <td className="score-cell" data-label="# Turns">20.2</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Grok</title><path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" /></svg> Grok-4-Fast<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">18.5<sub>± 2.0</sub></td>
                  <td className="score-cell" data-label="Pass@3">32.4</td>
                  <td className="score-cell" data-label="Pass^3">5.6</td>
                  <td className="score-cell" data-label="# Turns">15.9</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> Kimi-K2-thinking<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-11-22</td>
                  <td className="score-cell" data-label="Pass@1">17.6<sub>± 2.0</sub></td>
                  <td className="score-cell" data-label="Pass@3">29.6</td>
                  <td className="score-cell" data-label="Pass^3">4.6</td>
                  <td className="score-cell" data-label="# Turns">24.4</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> o3<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">17.0<sub>± 0.9</sub></td>
                  <td className="score-cell" data-label="Pass@3">25.0</td>
                  <td className="score-cell" data-label="Pass^3">9.3</td>
                  <td className="score-cell" data-label="# Turns">19.4</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> o4-mini<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">14.8<sub>± 0.8</sub></td>
                  <td className="score-cell" data-label="Pass@3">26.9</td>
                  <td className="score-cell" data-label="Pass^3">3.7</td>
                  <td className="score-cell" data-label="# Turns">16.6</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg> GPT-5-mini<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">14.5<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">23.1</td>
                  <td className="score-cell" data-label="Pass^3">5.6</td>
                  <td className="score-cell" data-label="# Turns">19.7</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero" /><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84" /><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84" /></linearGradient></defs></svg> Qwen-3-Coder<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">14.5<sub>± 1.9</sub></td>
                  <td className="score-cell" data-label="Pass@3">21.3</td>
                  <td className="score-cell" data-label="Pass^3">6.5</td>
                  <td className="score-cell" data-label="# Turns">28.5</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini-3.1-Flash-Lite<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2026-03-13</td>
                  <td className="score-cell" data-label="Pass@1">14.2<sub>± 1.2</sub></td>
                  <td className="score-cell" data-label="Pass@3">20.4</td>
                  <td className="score-cell" data-label="Pass^3">7.4</td>
                  <td className="score-cell" data-label="# Turns">31.2</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" fill="currentColor" fill-rule="evenodd" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M19.738 5.776c.163-.209.306-.4.457-.585.07-.087.064-.153-.004-.244-.655-.861-.717-1.817-.34-2.787.283-.73.909-1.072 1.674-1.145.477-.045.945.004 1.379.236.57.305.902.77 1.01 1.412.086.512.07 1.012-.075 1.508-.257.878-.888 1.333-1.753 1.448-.718.096-1.446.108-2.17.157-.056.004-.113 0-.178 0z" /><path d="M17.962 1.844h-4.326l-3.425 7.81H5.369V1.878H1.5V22h3.87v-8.477h6.824a3.025 3.025 0 002.743-1.75V22h3.87v-8.477a3.87 3.87 0 00-3.588-3.86v-.01h-2.125a3.94 3.94 0 002.323-2.12l2.545-5.689z" /></svg> Kimi-K2-0905<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Open-Source</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">13.0<sub>± 2.0</sub></td>
                  <td className="score-cell" data-label="Pass@3">22.2</td>
                  <td className="score-cell" data-label="Pass^3">5.6</td>
                  <td className="score-cell" data-label="# Turns">26.6</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini-2.5-Pro<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">10.5<sub>± 1.9</sub></td>
                  <td className="score-cell" data-label="Pass@3">21.3</td>
                  <td className="score-cell" data-label="Pass^3">2.8</td>
                  <td className="score-cell" data-label="# Turns">26.5</td>
                </tr>

                <tr className="rank-other">
                  <td className="model-name-cell" data-label="Model"><svg className="org-icon" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-0)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-1)" /><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-fill-2)" /><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962" /><stop offset="1" stop-color="#08B962" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543" /><stop offset="1" stop-color="#F94543" stop-opacity="0" /></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-fill-2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12" /><stop offset=".46" stop-color="#FABC12" stop-opacity="0" /></linearGradient></defs></svg> Gemini-2.5-Flash<span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span></td>
                  <td className="model-type-cell" data-label="Model Type">Proprietary</td>
                  <td className="text-cell" data-label="Agent">Default</td>
                  <td className="date-cell" data-label="Date">2025-10-28</td>
                  <td className="score-cell" data-label="Pass@1">3.7<sub>± 1.5</sub></td>
                  <td className="score-cell" data-label="Pass@3">8.3</td>
                  <td className="score-cell" data-label="Pass^3">0.0</td>
                  <td className="score-cell" data-label="# Turns">8.3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="legend-section leaderboard-history-legend">
          <p className="legend-text">
            <span className="verified-badge" aria-hidden="true" title="Evaluated by us">✓</span> Results bearing this badge were independently evaluated by us; sources for all other results are linked in the corresponding model names.
          </p>

          <p className="legend-text">
            <sup>†</sup> Claude-Opus was evaluated once due to budget constraints.
          </p>

          <p className="legend-text">
            <sup>‡</sup> OpenAI models require the Responses API to achieve better native performance. Therefore, we modified the codebase to support the Responses API for these models, updated the results accordingly, and removed the previous results that were based on the Chat Completions API.
          </p>
        </div>
      </div>
    </Accordion>
  </div>
</div>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.