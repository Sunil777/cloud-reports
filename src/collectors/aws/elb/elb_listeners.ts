import * as AWS from "aws-sdk";
import { CollectorUtil } from "../../../utils";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";
import { ElbV2sCollector } from "./elbs";

export class ElbV2ListenersCollector extends BaseCollector {
    public collect() {
        return this.getAllElbListeners();
    }

    private async getAllElbListeners() {
        const self = this;
        const serviceName = "ELBv2";
        const elbRegions = self.getRegions(serviceName);
        const elbV2sCollector = new ElbV2sCollector();
        elbV2sCollector.setSession(this.getSession());
        const elb_listeners = {};
        try {
            const elbsData = await CollectorUtil.cachedCollect(elbV2sCollector);
            const elbs = elbsData.elbs;
            for (const region of elbRegions) {
                try {
                    const elbService = self.getClient(serviceName, region) as AWS.ELBv2;
                    const regionElbs = elbs[region];
                    const allRegionElbListeners = {};
                    for (const elb of regionElbs) {
                        const regionElbListeners: AWS.ELBv2.DescribeListenersOutput
                            = await elbService.describeListeners({ LoadBalancerArn: elb.LoadBalancerArn }).promise();
                        allRegionElbListeners[elb.LoadBalancerName] = regionElbListeners.Listeners;
                    }
                    elb_listeners[region] = allRegionElbListeners;
                } catch (error) {
                    AWSErrorHandler.handle(error);
                    continue;
                }
            }
        } catch (error) {
            AWSErrorHandler.handle(error);
        }
        return { elb_listeners };
    }
}
