<script setup>
import PrivacyPolicy from '../views/AccountPage_List/PrivacyPolicy.vue';
import TermsAndConditions from '../views/AccountPage_List/TermsAndConditions.vue';
import { ref } from 'vue';

const hasUserAcceptedTerms = localStorage.getItem('hasAcceptedTermsAndAgreements');
const hasAccepted = ref(hasUserAcceptedTerms == 'true');

function acceptTermsAndAgreements() {
    localStorage.setItem('hasAcceptedTermsAndAgreements', 'true');
    document.getElementById('tappmodalParent').style.display = 'none';
    hasAccepted.value = true;
}
</script>

<template>
    <div class="tappmodal" id="tappmodalParent" v-if="!hasAccepted">
        <div class="modal" role="dialog" id="tappmodal">
            <div class="modal-box">
                <h3 class="font-bold text-lg">Terms and Conditions | Privacy Policy</h3>
                <p class="py-4">Kindly review the following documents and accept our terms and conditions
                    before accessing the website.
                </p>

                <div class="documents">
                    <div class="ta">
                        <PrivacyPolicy></PrivacyPolicy>
                    </div>

                    <div class="pp">
                        <TermsAndConditions></TermsAndConditions>
                    </div>
                </div>

                <div class="modal-action">
                    <a href="#" class="btn btn-success" @click="acceptTermsAndAgreements">Accept</a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tappmodal {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    /* display: none;s */
}

.modal {
    opacity: 1 !important;
    pointer-events: all;
}

.modal-box {
    max-height: calc(var(--article-stack-height) - 10%);
    position: relative;
}

.modal * {
    color: white;
}

.buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 13%;
    margin-top: 6%;
    box-sizing: border-box;
}

.documents {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: 60%;
}

.pp,
.ta {
    /* color: red; */
    /* background-color: rgb(191, 191, 191, 0.2); */
    border-radius: 10px;
    padding: 10px;
    /* height: 30vh; */
    overflow: scroll;
    background-color: rgba(255, 255, 255, 0.1);
}
</style>