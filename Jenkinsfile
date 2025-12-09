pipeline {
  agent any

  tools {
    nodejs "NodeJS"
  }

  environment {
    BUILD_DIR = "dist"
  }

      stages {
          stage('Checkout') {
              steps {
                  checkout scm
              }
          }

          stage('Install') {
              steps {
                  sh 'npm ci'
              }
          }

          stage('Build') {
              steps {
                  sh 'npm run build:dev'
              }
          }

          stage('Archive') {
              steps {
                  archiveArtifacts artifacts: "${BUILD_DIR}/**/*", fingerprint: true
              }
          }
      }

      post {
              always {
                  cleanWs()
              }
          }
}