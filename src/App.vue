<template>
  <div>
    <div class="container is-fluid">
      <div class="navbar">
        <div class="navbar-brand">
          <a class="navbar-item" href="https://www.techsoft3d.com">
            <img src="./assets/ts3d_logo.svg" alt="HOOPS Web Platform">
          </a>
        </div>
        <div class="navbar-end">
          <a class="navbar-item" href="https://www.techsoft3d.com/products/hoops/web-platform">
            <img src="./assets/hoopswebplatform_logo.png" alt="HOOPS Web Platform">
          </a>       
        </div>
      </div>
      <div>
        <div class="columns">
          <div class="column is-one-quarter">
            <appSidebar></appSidebar>
            <appDeviceProperties></appDeviceProperties>
            <appToolbar></appToolbar>
          </div>
          <div class="column">
            <appContent></appContent>
          </div>
        </div>
      </div>
    </div>
    <div>
      <appSetAlarmModal></appSetAlarmModal>
      <appAlarmModal></appAlarmModal>
    </div>
  </div>
</template>

<script>
  import Sidebar from './Sidebar.vue'
  import Content from './Content.vue'
  import SetAlarmModal from './SetAlarmModal.vue'
  import DeviceProperties from './DeviceProperties.vue'
  import Toolbar from './Toolbar.vue'
  import AlarmModal from './AlarmModal.vue'

  export default {
      components: {
        appSidebar: Sidebar,
        appContent: Content,
        appSetAlarmModal: SetAlarmModal,
        appDeviceProperties: DeviceProperties,
        appToolbar: Toolbar,
        appAlarmModal: AlarmModal
      }
  }

</script>
