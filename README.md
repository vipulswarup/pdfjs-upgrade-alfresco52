# Alfresco AIO Project - SDK 3

All-In-One (AIO) project for Alfresco SDK 3.0 targeting Alfresco 5.2. Platform and Share modules are packaged as AMP files and applied to `alfresco.war` and `share.war` with the Module Management Tool.

Run with `mvn clean install -DskipTests=true alfresco:run` or `./run.sh` and verify that it

 * Runs the embedded Tomcat + H2 DB
 * Runs Alfresco Platform (Repository)
 * Runs Alfresco Solr4
 * Runs Alfresco Share
 * Packages Platform and Share modules as AMP files (`pdfjs-upgrade-alfresco52-platform-amp` and `pdfjs-upgrade-alfresco52-share-amp`)

# Few things to notice

 * No parent pom
 * No WAR projects, all handled by the Alfresco Maven Plugin
 * No runner project - it's all in the Alfresco Maven Plugin
 * AMP packaging via Maven Assembly (the module JAR is placed in the AMP `/lib` directory)
 * Works seamlessly with Eclipse and IntelliJ IDEA
 * JRebel for hot reloading, JRebel maven plugin for generating rebel.xml, agent usage: `MAVEN_OPTS=-Xms256m -Xmx1G -agentpath:/home/martin/apps/jrebel/lib/libjrebel64.so`
 * AMP layout is defined in each module's `src/main/assembly/amp.xml`
 * [Configurable Run mojo](https://github.com/Alfresco/alfresco-sdk/blob/sdk-3.0/plugins/alfresco-maven-plugin/src/main/java/org/alfresco/maven/plugin/RunMojo.java) in the `alfresco-maven-plugin`
 * No unit testing/functional tests just yet
 * Resources loaded from META-INF
 * Web Fragment (this includes a sample servlet configured via web fragment)

# TODO

  * Abstract assembly into a dependency so we don't have to ship the assembly in the archetype
  * Purge
  * Functional/remote unit tests
