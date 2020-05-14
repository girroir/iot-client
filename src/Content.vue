<template>
    <div>
        <div class="tabs is-centered is-marginless">
            <ul>
                <li :class="[ view==='app-building' ? 'is-active' : '' ]" @click="navigate('app-building')">
                    <a>Building</a>
                </li>
                <li :class="[ view==='app-history' ? 'is-active' : '' ]" class="control" @click="navigate('app-history')">
                    <a>History</a>
                </li>
            </ul>
        </div>
        <!--<div class="level">
            <div class="level-left"></div>
            <div class="level-center"></div>
            <div class="level-right">
                <div class="field has-addons">
                    <p class="control" @click="navigate('app-building')">
                        <a :class="[ 'button', view==='app-building' ? 'is-active' : '' ]">
                            <span class="icon">
                                <i class="far fa-lg fa-building"></i>
                            </span>
                        </a>
                    </p>
                    <p class="control" @click="navigate('app-history')">
                        <a :class="[ 'button', view==='app-history' ? 'is-active' : '' ]">
                            <span class="icon">
                                <i class="fas fa-lg fa-chart-area"></i>
                            </span>
                        </a>
                    </p>
                </div>
            </div>
        </div>-->
        <keep-alive>
            <component :is="view"></component>
        </keep-alive>
    </div>
</template>

<script>
    import Building from './Building.vue';
    import History from './History.vue';

    export default {
        data() {
            return {
                view: 'app-building'
            };
        },
        components: {
            appBuilding: Building,
            appHistory: History
        },
        methods:
        {
            navigate(newView) {
                this.view = newView;
            }
        }
    }
</script>