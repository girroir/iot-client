<template>
    <div class="navbar">
        <div class="navbar-end">
            <!--<a class="navbar-item" @click="onToggleTransparency()">
                <span class="icon">
                    <i class="far fa-building"></i>
                </span>
            </a>-->
            <a class="navbar-item" @click="onToggleMarkup()">
                <span class="icon">
                    <i class="fas fa-server"></i>
                </span>
            </a>
            <a class="navbar-item" @click="onToggleWalk()" title="Walk mode">
                <span class="icon">
                    <i class="fas fa-shoe-prints"></i>
                </span>
            </a>
        </div>
    </div>
</template>

<script>
 
    export default {
        methods: {
            onToggleMarkup() {
                this.$store.dispatch('setMarkupVisibility', !this.$store.state.markupVisibility)
            },
            onToggleTransparency()
            {
                if( this.$store.state.modelTransparency == 1 ) {
                    this.$store.dispatch('setModelTransparency', 0.3 );
                } else {
                    this.$store.dispatch('setModelTransparency', 1 );
                }
            },
            onToggleWalk()
            {
                this.$store.commit('setWalkMode', !this.$store.state.walkMode)
            }
        },
    }
</script>