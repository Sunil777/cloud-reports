import * as AWS from "aws-sdk";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";

export class RedshiftClustersCollector extends BaseCollector {
    public collect(callback: (err?: Error, data?: any) => void) {
        return this.getAllClusters();
    }

    private async getAllClusters() {

        const self = this;

        const serviceName = "Redshift";
        const redshiftRegions = self.getRegions(serviceName);
        const clusters = {};

        for (const region of redshiftRegions) {
            try {
                const redshift = self.getClient(serviceName, region) as AWS.Redshift;
                clusters[region] = [];
                let fetchPending = true;
                let marker: string | undefined;
                while (fetchPending) {
                    const clustersResponse:
                        AWS.Redshift.Types.ClustersMessage = await redshift.describeClusters
                        ({ Marker: marker }).promise();
                    clusters[region] = clusters[region].concat(clustersResponse.Clusters);
                    marker = clustersResponse.Marker;
                    fetchPending = marker !== undefined;
                }
            } catch (error) {
                AWSErrorHandler.handle(error);
            }
        }
        return { clusters };
    }
}
